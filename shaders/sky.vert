/////////////////////////////////////////////////////////////////////////

// Varying
// --------------------------------------------------------------------

varying vec3 vWorldPosition;
varying vec2 vUv;

/////////////////////////////////////////////////////////////////////////

// ====================================================================
// MAIN METHOD",
// ====================================================================
void main()
{
	// Transforming from model, to world, and to view coordinates
	vec4 vertex = vec4( position, 1.0 );
    vec4 worldPosition = modelMatrix * vertex;
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vertex;

    // Update uv coordinates
    vUv = uv;	    
}

/////////////////////////////////////////////////////////////////////////