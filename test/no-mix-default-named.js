'use strict';

var NAMED_EXPORT_MESSAGE = 'Unexpected named export after default export';
var DEFAULT_EXPORT_MESSAGE = 'Unexpected default export after named export';

var eslint = require('eslint');
var ruleTester = new eslint.RuleTester();

ruleTester.run('rules/no-mix-default-named', require('../rules/no-mix-default-named'), {
  valid: [
    { code: 'export default "x"', ecmaFeatures: { modules: true } },
    { code: 'export function house() {}', ecmaFeatures: { modules: true } },
    { code: 'export var a = 1;', ecmaFeatures: { modules: true } },
    { code: 'export const b = 2;', ecmaFeatures: { modules: true, blockBindings: true } },
    { code: 'export const b = 2; export function house() {}', ecmaFeatures: { modules: true, blockBindings: true } }
  ],

  invalid: [
    { code: 'export default "x"; export var a = 1;', ecmaFeatures: { modules: true }, errors: [ { message: NAMED_EXPORT_MESSAGE }] },
    { code: 'export default 0; export function home() {}', ecmaFeatures: { modules: true }, errors: [ { message: NAMED_EXPORT_MESSAGE }] },
    { code: 'export const b = 1; export default b;', ecmaFeatures: { modules: true, blockBindings: true }, errors: [ { message: DEFAULT_EXPORT_MESSAGE }] }
  ]
});
