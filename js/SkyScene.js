// ==============================================================================
// SkyScene.js
// ------------------------------------------------------------------------------
// Using vertex and fragment shaders inspired by Joshua Koo, Simon Wallner, and
// Preetham/Hoffner's paper(s) on Mie and Rayleigh scattering, this constructs
// a scene with a sky dome and a rising and setting sun. 
//
// For more information on the shader, consult skyShader.js
// ------------------------------------------------------------------------------
// Angela Gross
// CSCI 441
// Project 1: November 2014
// ==============================================================================
/*global THREE, requestAnimationFrame, dat, window */

// Scene
var camera, scene, renderer;
var cameraControls;
var effectController;
var clock = new THREE.Clock();

// Sun
var sun = { azimuth: 0.0, inclination: 0.0, position: {x: 0, y:0, z: 0} };
var distance = 90000;
var followSun = true;
var speed = 0.001;

// Sky
var sky;
var skySize = 450000;

// Sun/Sky Shader
var skyShader = new SkyShader();

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// LIGHTING AND SKY

// ==========================================================================================================
// makeSun()
// ----------------------------------------------------------------------------------------------------------
// Makes an object that stores an object that stores sun information for the sky shader.
// ==========================================================================================================
function makeSun()
{
    var theta = Math.PI * (sun.azimuth - 0.5);
    var phi = 2 * Math.PI * (sun.inclination - 0.5);
    sun.position.x = distance * Math.cos(phi);
    sun.position.y = distance * Math.sin(phi) * Math.sin(theta); 
    sun.position.z = distance * Math.sin(phi) * Math.cos(theta);
}

// ==========================================================================================================
// addSky()
// ----------------------------------------------------------------------------------------------------------
// Creates a sky dome with a sun included using the shader provided in sunShader.js
// ==========================================================================================================
function addSky()
{
	var skyUniforms = THREE.UniformsUtils.clone( skyShader.uniforms );

	var skyMat = new THREE.ShaderMaterial
	({ 
		fragmentShader: skyShader.fragmentShader, 
		vertexShader: skyShader.vertexShader, 
		uniforms: skyUniforms,
		side: THREE.BackSide
	});

	var skyGeo = new THREE.SphereGeometry( skySize, 32, 15 );
	sky = new THREE.Mesh( skyGeo, skyMat );

	scene.add(sky);
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// INITIALIZATION OF SCENE

function init() 
{	
	// CANVAS
	var canvasWidth = window.innerWidth;
	var canvasHeight = window.innerHeight;
	
	// CAMERA
	camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.5, 2000000 );
	camera.position.set( 0, 100, 2000 );
	
	// RENDERER
	renderer = new THREE.WebGLRenderer({ antialias: false });
	renderer.setSize( canvasWidth, canvasHeight );
	
	var container = document.getElementById('container');
	container.appendChild( renderer.domElement );
	
	renderer.gammaInput = true;
	renderer.gammaOutput = true;
	
	// EVENTS
	window.addEventListener( 'resize', onWindowResize, false );
	
	// CONTROLS
	cameraControls = new THREE.OrbitAndPanControls( camera, renderer.domElement );
	
	// GUI
	setupGui();
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// EVENT HANDLERS

function onWindowResize() 
{
	var canvasWidth = window.innerWidth;
	var canvasHeight = window.innerHeight;
	renderer.setSize( canvasWidth, canvasHeight );
	camera.aspect = canvasWidth/ canvasHeight;
	camera.updateProjectionMatrix();
}

function setupGui() 
{
	effectController  =
	{
		turbidity: 1.2,
		rayleighCoefficient: 0.3,
		mieCoefficient: 0.017,
		mieDirectionalG: 0.99,
		luminance: 0.999,
		inclination: 0.001,
		speed: 0.0001,
		followSun: true,
	}
        
	var gui = new dat.GUI();
	gui.add( effectController, "turbidity", 1.0, 20.0, 0.1 ).onChange( updateUniforms );
    gui.add( effectController, "rayleighCoefficient", 0.0, 4.0, 0.001 ).onChange( updateUniforms );
    gui.add( effectController, "mieCoefficient", 0.0, 0.1, 0.001 ).onChange( updateUniforms );
    gui.add( effectController, "mieDirectionalG", -1.0, 1.0, 0.001 ).onChange( updateUniforms );
    gui.add( effectController, "luminance", 0.000, 1.000, 0.001).onChange( updateUniforms );
    gui.add( effectController, "inclination", -1.000, 1.000, 0.001).onChange( updateUniforms );
    gui.add( effectController, "speed", { Stopped: 0.0, Slow: 0.0001, Fast: 0.001 }).onChange( updateUniforms );
    gui.add( effectController, "followSun").onChange( updateUniforms );
    
    updateUniforms();     
}

function updateUniforms()
{
    skyShader.uniforms.turbidity.value = effectController.turbidity;
    skyShader.uniforms.rayleighCoefficient.value = effectController.rayleighCoefficient;
    skyShader.uniforms.mieCoefficient.value = effectController.mieCoefficient;
    skyShader.uniforms.mieDirectionalG.value = effectController.mieDirectionalG;
    skyShader.uniforms.luminance.value = effectController.luminance;
    speed = parseFloat(effectController.speed);
    followSun = effectController.followSun;

    // Only change inclination if we are not moving the sun.
    if(speed == 0.0)
    {
    	sun.inclination = effectController.inclination;
	    var theta = Math.PI * (sun.azimuth - 0.5);
	    var phi = 2 * Math.PI * (sun.inclination - 0.5);
	    sun.position.x = distance * Math.cos(phi);
	    sun.position.y = distance * Math.sin(phi) * Math.sin(theta); 
	    sun.position.z = distance * Math.sin(phi) * Math.cos(theta);

	    // Update uniform position for shader
    	skyShader.uniforms.sunPosition.value.set(sun.position.x, sun.position.y, sun.position.z);
    }


    // SCENE
    fillScene();
}

function age()
{
	// Move sun and update position
	sun.inclination += speed;
    var theta = Math.PI * (sun.azimuth - 0.5);
    var phi = 2 * Math.PI * (sun.inclination - 0.5);
    sun.position.x = distance * Math.cos(phi);
    sun.position.y = distance * Math.sin(phi) * Math.sin(theta); 
    sun.position.z = distance * Math.sin(phi) * Math.cos(theta);

    // Update uniform position for shader
    skyShader.uniforms.sunPosition.value.set(sun.position.x, sun.position.y, sun.position.z);

    // Target sun
    if(followSun)
    	cameraControls.target.set(sun.position.x, sun.position.y, sun.position.z);

    // Fill scene again
    fillScene();
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// BASIC SCENE-STARTUP FUNCTIONS

function animate() 
{
	requestAnimationFrame( animate );
	render();
	age();
}

function render() 
{
	var delta = clock.getDelta();
	cameraControls.update( delta );
	renderer.render( scene, camera );
}

function fillScene() 
{
	// SCENE 
	scene = new THREE.Scene();
	
	// CAMERA
	scene.add(camera);

	// MAKE SUN OBJECT (holds position information)
	makeSun();
	
	// SKY AND SUN DOME
	addSky();
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
