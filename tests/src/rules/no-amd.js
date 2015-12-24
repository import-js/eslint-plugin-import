'use strict';

var eslint = require('eslint');
var ruleTester = new eslint.RuleTester();

ruleTester.run('rules/no-define', require('../rules/no-define'), {
	valid: [
		{ code: 'import "x";', ecmaFeatures: { modules: true } },
		{ code: 'import x from "x"', ecmaFeatures: { modules: true } },
		'var x = require("x")',
		'require("x")',
		'require([], function() {})',
		'require(["a"], function(a) {})'
	],

	invalid: [
		{ code: 'define([], function() {})', errors: [ { message: 'Expected require() instead of define().' }] },
		{ code: 'define(["a"], function(a) { console.log(a); })', errors: [ { message: 'Expected require() instead of define().' }] }
	]
});
