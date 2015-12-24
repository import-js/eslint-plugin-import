'use strict';

var EXPORT_MESSAGE = 'Expected "export" or "export default"',
	IMPORT_MESSAGE = 'Expected "import" instead of "require()"';

var eslint = require('eslint');
var ruleTester = new eslint.RuleTester();

ruleTester.run('rules/no-cjs', require('../rules/no-cjs'), {
	valid: [

		// imports
		{ code: 'import "x";', ecmaFeatures: { modules: true } },
		{ code: 'import x from "x"', ecmaFeatures: { modules: true } },
		{ code: 'import x from "x"', ecmaFeatures: { modules: true } },
		{ code: 'import { x } from "x"', ecmaFeatures: { modules: true } },

		// exports
		{ code: 'export default "x"', ecmaFeatures: { modules: true } },
		{ code: 'export function house() {}', ecmaFeatures: { modules: true } },

		// allowed requires
		{ code: 'function a() { var x = require("y"); }' }, // nested requires alloewd
		{ code: 'require.resolve("help")' }, // methods of require are allowed
		{ code: 'require.ensure([])' }, // webpack specific require.ensure is allowed
		{ code: 'require([], function(a, b, c) {})' } // AMD require is allowed
	],

	invalid: [

		// imports
		{ code: 'var x = require("x")', errors: [ { message: IMPORT_MESSAGE }] },
		{ code: 'require("x")', errors: [ { message: IMPORT_MESSAGE }] },

		// exports
		{ code: 'exports.face = "palm"', errors: [ { message: EXPORT_MESSAGE }] },
		{ code: 'module.exports.face = "palm"', errors: [ { message: EXPORT_MESSAGE }] },
		{ code: 'module.exports = face', errors: [ { message: EXPORT_MESSAGE }] },
		{ code: 'exports = module.exports = {}', errors: [ { message: EXPORT_MESSAGE }] },
		{ code: 'var x = module.exports = {}', errors: [ { message: EXPORT_MESSAGE }] }
	]
});
