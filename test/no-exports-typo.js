'use strict';

var eslint = require('eslint');
var ruleTester = new eslint.RuleTester();

ruleTester.run('rules/no-exports-typo', require('../rules/no-exports-typo'), {
	valid: [
		'module.exports = true;',
		'module.exports.house()',
		'exports.mouse = 234',
		'exports = module.exports = {}',
		'var House = module.exports = function() {}'
	],

	invalid: [
		{ code: 'module.exprts = 123;', errors: [ { message: 'Expected module.exports.' }] },
		{ code: 'module.exprts = 123;', errors: [ { message: 'Expected module.exports.' }] },
		{ code: 'module.export = 123;', errors: [ { message: 'Expected module.exports.' }] },
		{ code: 'module.export()', errors: [ { message: 'Expected module.exports.' }] },
		{ code: 'module.extorts.house()', errors: [ { message: 'Expected module.exports.' }] }
	]
});
