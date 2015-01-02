// ==============================================================================
// Tester.js
// ------------------------------------------------------------------------------
// Simple object that iterates over an associative array with functions inside
// and runs them. Accumulates results of tests in an object.
//
// NOTE: This object is only useful if arguments aren't needed and values aren't
// returned.
// ------------------------------------------------------------------------------
// Angela Gross
// CSCI 441
// Project 1: November 2014
// ==============================================================================

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// CONSTRUCTOR
var Tester = function(name, functions)
{
	this.name = name;
	this.functions = functions;
	this.testResults = {};
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// ==========================================================================================================
// test()
// ----------------------------------------------------------------------------------------------------------
// Iterates through the functions and calls them. Catches an error if they occur and puts that in the
// test results object.
// ==========================================================================================================
Tester.prototype.test = function()
{
	for(var funct in this.functions)
	{
		try
		{
			this.functions[funct]();
			this.testResults[funct] = { failed: false, errorMsg: "", };
		}
		catch(error)
		{
			this.testResults[funct] = { failed: true, errorMsg: error.message };
		}
	}
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



