/////////////////////////////////////////////////////////////////////////

// Uniforms
// --------------------------------------------------------------------
uniform sampler2D textureSampler;
uniform float turbidity;
uniform float rayleighCoefficient;
uniform float mieCoefficient;
uniform float mieDirectionalG;
uniform float luminance;
uniform vec3 sunPosition;

/////////////////////////////////////////////////////////////////////////

// Varying
// --------------------------------------------------------------------
varying vec3 vWorldPosition;
varying vec2 vUv;

/////////////////////////////////////////////////////////////////////////

// Basic Constants
// --------------------------------------------------------------------
// pi
const float pi = 3.1415926535897932384626433832795028841971693993751058;
// up direction (y)
const vec3 up = vec3(0.0, 1.0, 0.0);

/////////////////////////////////////////////////////////////////////////

// Constants for sun
// --------------------------------------------------------------------

// Sun direction (normalized sun position)
vec3 sunDirection = normalize(sunPosition);

/////////////////////////////////////////////////////////////////////////

// Constants for particle/gas scattering (Mie and Rayleigh)
// --------------------------------------------------------------------

// Depolarization factor of air (Preetham)
const float pn = 0.035;
// Refractive index of air
const float n = 1.0003;
// Molecules per unit air
const float N = 2.545E25;
// Optical length at zenith for molecules and particles, respectively.
const float rayleighZenithLength = 8.4E3;
const float mieZenithLength = 1.25E3;

/////////////////////////////////////////////////////////////////////////

// Constants for Mie (given by Preetham on pg. 28)
// --------------------------------------------------------------------
// Wavelengths in meters -> red, green, blue light
const vec3 lambda = vec3(680E-9, 550E-9, 450E-9);
// K coeffecient -> correspond to lambda
const vec3 K = vec3(0.686, 0.678, 0.666);
// Junge's exponent (4 for Preetham's sky model)
const float v = 4.0;

/////////////////////////////////////////////////////////////////////////

// ====================================================================
// Calculate total Rayleigh Scattering for molecules.
// betaR = 
// [(8pi^3(n^2 - 1)^2) / (3N * lambda ^ 4)] * [ (6 + 3pn) / (6 - 7pn) ]
// ====================================================================
vec3 totalRayleighScattering()
{
	return (8.0 * pow(pi, 3.0) * pow(pow(n, 2.0) - 1.0, 2.0) * (6.0 + 3.0 * pn)) / (3.0 * N * pow(lambda, vec3(4.0)) * (6.0 - 7.0 * pn));
}

// ====================================================================
// Calculate the Rayleigh phase.",
// fR(theta) = (3 / (16 * pi)) * (1 + cos^2(theta))
// ====================================================================
float rayleighPhase(float cosTheta)
{
	return (3.0 / (16.0 * pi)) * (1.0 + pow(cosTheta, 2.0) );
}

// ====================================================================
// Calculate total Mie Scattering for haze.",
// betaM = (0.434 * c * pi) * [ (2pi / lambda)^(v-2) ] * K
// ====================================================================
vec3 totalMieScattering()
{
	// Concentration factor
	float c = (0.6544 * turbidity - 0.6510) * 1.0E-16;
	return (0.434 * c * pi) * pow( (2.0 * pi) / lambda, vec3(v - 2.0) ) * K;
}

// ====================================================================
// Calculate the Mie phase (approximated by Henyey-Greenstein)
// fHG(theta) = 
// [ (1 - g)^2 ] / [ 4pi*(1 + g^2 - 2gcos(theta))^(3/2) ]
// ====================================================================
float miePhase(float cosTheta)
{
	return (1.0 - pow(mieDirectionalG, 2.0)) / ( (4.0*pi) * ( pow(1.0 + pow(mieDirectionalG, 2.0) - 2.0 * mieDirectionalG * cosTheta, 1.5)));
}

// ====================================================================
// Calculate Esun, or the intensity of the sun. (given by Joshua Koo
// and Simon Wallner).
// ====================================================================
float sunIntensity(float zenithCosTheta)
{
	float cutoffAngle = pi/1.95;
	float steepness = 1.5;
	return 1000.0 * max(0.0, 1.0 - exp(-((cutoffAngle - acos(zenithCosTheta))/steepness)));
}

// ====================================================================
// Calculate the extinction (absorption and out-scattering) and in-
// scattering (additive light).
// L(s, theta) = L0 * Fex(s) + Lin(s, theta)
// ====================================================================
vec3 allLightScattering()
{
	// Since sunDirection and up are normalized, we get cosTheta with the dot product.
	float Esun = sunIntensity(dot(sunDirection, up));

	// Viewing direction (or eye direction)
	vec3 direction = normalize(vWorldPosition - cameraPosition);

	// betaR and betaM (product of rayleigh and mie scattering by given coeffecients)
	vec3 betaR = totalRayleighScattering() * rayleighCoefficient;
	vec3 betaM = totalMieScattering() * mieCoefficient;
	vec3 betaEX = betaR + betaM;

	// Use optical length at zenith to calculate distance light travels for molecules and particles.
	float zenithAngle = acos(max(0.0, dot(up, direction))); // Want to be < 90 to avoid singularity in length calculation.
	float zenithAngleDeg = degrees(zenithAngle);
	float sR = rayleighZenithLength / (cos(zenithAngle) + 0.15 * pow(93.885 - zenithAngleDeg, -1.253));
	float sM = mieZenithLength / (cos(zenithAngle) + 0.15 * pow(93.885 - zenithAngleDeg, -1.253));

	// Combined extinction
	vec3 Fex = exp(-(betaR * sR + betaM * sM));
	// Suggestion given to Simon Wallner to help with reds
	Fex = mix(1.0 - Fex, Fex, abs(sunDirection.y));

	// Since direction and sunDirection are normalized, we get cosTheta with dot product.
	float cosTheta = dot(direction, sunDirection);

	// Combined scattering	
	// betaSC(theta) = betaR * fR(theta) + betaM * fHG(theta)
	vec3 betaSC = (betaR * rayleighPhase(cosTheta)) + (betaM * miePhase(cosTheta));

	// Lin(s, theta) = ( betaSC(theta) / betaEX ) * Esun * [ 1 - Fex(s) ]
	vec3 Lin = Esun * (betaSC / betaEX) * (1.0 - Fex);
	vec3 L0 = texture2D(textureSampler, vUv).rgb * Fex;

	// All scattering
	return ((L0 * Fex) + Lin);
}

// ====================================================================
// Tonemap from Uncharted 2 provided by: 
// http://filmicgames.com/archives/75
// ====================================================================
vec3 tonemap(vec3 x)
{
	float A = 0.15;
	float B = 0.50;
	float C = 0.10;
	float D = 0.20;
	float E = 0.02;
	float F = 0.30;
	float W = 1000.0;
   "return ((x*(A*x+C*B)+D*E)/(x*(A*x+B)+D*F))-E/F;
}

/////////////////////////////////////////////////////////////////////////

// ====================================================================
// MAIN METHOD
// ====================================================================
void main()
{
	// Using the atmospheric scattering theory provided by Preetham,
	// compute the texture color.
	vec3 textureColor = allLightScattering();

	// Adjust atmospheric scattering color by adding high dynamic range rendering. (given by Joshua Koo)
	float sunFade = 1.0 - clamp(1.0 - exp( (sunPosition.y / 450000.0 ) ) , 0.0, 1.0);
	vec3 curr = tonemap( (log2(2.0 / pow(luminance, 4.0))) * textureColor);
	vec3 whiteScale = 1.0 / tonemap(vec3(1000.0));
	vec3 color = curr * whiteScale;
	vec3 finalColor = pow(color, vec3(1.0 / (1.2 + (1.2 * sunFade))));

	// Update color of fragment
	gl_FragColor.rgb = finalColor;
	// Black atmosphere
	gl_FragColor.a = 1.0;
}

/////////////////////////////////////////////////////////////////////////