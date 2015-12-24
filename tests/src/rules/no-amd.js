import { RuleTester } from 'eslint'

var ruleTester = new RuleTester()

ruleTester.run('no-amd', require('rules/no-amd'), {
	valid: [
		{ code: 'import "x";', ecmaFeatures: { modules: true } },
		{ code: 'import x from "x"', ecmaFeatures: { modules: true } },
		'var x = require("x")',
		'require("x")',
		'require([], function() {})',
		'require(["a"], function(a) {})',
	],

	invalid: [
		{ code: 'define([], function() {})', errors: [ { message: 'Expected imports instead of define().' }] },
		{ code: 'define(["a"], function(a) { console.log(a); })', errors: [ { message: 'Expected imports instead of define().' }] },
	],
})
