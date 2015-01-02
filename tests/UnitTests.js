// ==============================================================================
// UnitTests.js
// ------------------------------------------------------------------------------
// This object performs tests on SkyScene.js and the shaders in SkyShader.js and
// stores the results of the test in "output". 
// ------------------------------------------------------------------------------
// Angela Gross
// CSCI 441
// Project 1: November 2014
// ==============================================================================

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// CONSTRUCTOR
var UnitTests = function()
{
	// What will be printed on index.html
	this.output = "<hr>";
	
	// The tests to loop through
	this.testers = new Array();

	// SKY SCENE UNIT TESTS
	// --------------------------------------------------------------------------
	var skySceneFunctions = 
	{
		"init": init,
		"animate": animate,
		"makeSun" : makeSun,
		"addSky": addSky,
		"onWindowResize": onWindowResize,
		"setupGui": setupGui,
		"updateUniforms": updateUniforms,
		"age": age,
		"render": render,
		"fillScene": fillScene
	};
	this.testers.push(new Tester("Sky Scene", skySceneFunctions));

	// SHADER UNIT TESTS
	// --------------------------------------------------------------------------
	var skyShaderFunctions ={"testShaders" : testShaders,};
	this.testers.push(new Tester("Sky Shaders", skyShaderFunctions));
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// PERFORMING TESTS

// ==========================================================================================================
// run()
// ----------------------------------------------------------------------------------------------------------
// Runs through all of the testing objects. If errors are found, then they are printed. Also prints the
// number of tests that passed.
// ==========================================================================================================
UnitTests.prototype.run = function()
{
	// TESTING
	// --------------------------------------------------------------------------
	for(var i = 0; i < this.testers.length; i++)
	{
		var tester = this.testers[i];
		
		this.output += "<h2>Results from " + tester.name + ": </h2>";
		
		tester.test();
		
		var results = tester.testResults;
		var numTests = Object.keys(results).length;
		var numFailed = 0;
		
		for(methodName in results)
		{
			var result = results[methodName];
			
			if (result.failed)
			{
				this.output += "Method " + methodName + "() failed. Error message: " + result.errorMsg + "<br>";
				numFailed++;
			}
			else
			{
				this.output += "Method " + methodName + "() succeeded! <br>";
			}	
		}
		
		this.output += "<br>" + tester.name + " passed <b>" + (numTests - numFailed) + "</b> of <b>" + numTests  + "</b> tests. <br><br><hr>";
	}
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// CUSTOM TESTS

// ==========================================================================================================
// testShaders()
// ----------------------------------------------------------------------------------------------------------
// Inspired by https://github.com/mrdoob/three.js/issues/2433, initializes the shaders to see if they are
// working.
// NOTE: This WILL NOT WORK if init() and animate() HAVE NOT been called from SkyScene.js because the
// variables renderer, skyShader, and scene are needed.
// ==========================================================================================================
function testShaders()
{
	// Get the WebGL context from the renderer
	var gl = renderer.getContext();
	
	// Make  uniforms, shader material, and make a temporary object 3D.
	var skyUniforms = THREE.UniformsUtils.clone( skyShader.uniforms );
	var skyMat = new THREE.ShaderMaterial
	({ 
		fragmentShader: skyShader.fragmentShader, 
		vertexShader: skyShader.vertexShader, 
		uniforms: skyUniforms,
		side: THREE.BackSide
	});
	var skyObj = THREE.Object3D();
	
	// Use the pre-existing variables from the scene to initialize the  material and check its status
	renderer.initMaterial( skyMat, scene.__lights, scene.fog, skyObj );
	var status =  gl.getProgramParameter( skyMat.program, gl.LINK_STATUS );
	
	// If something goes wrong, then throw an error letting the user know.
	if (!status)
	{
		var error = { message: "Something went wrong. Check the console for errors from WebGL."};
		throw error;	
	}
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

