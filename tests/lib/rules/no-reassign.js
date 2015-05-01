'use strict'

var linter = require('eslint').linter,
    ESLintTester = require('eslint-tester')

var eslintTester = new ESLintTester(linter)

var test = require('../../utils').test

eslintTester.addRuleTest('lib/rules/no-reassign', {
  valid: [
    test({code: 'import { foo } from \'./bar\'; bar = 42;'})
    // may assign to imported names\' members
  , test({code: 'import { foo } from \'./bar\'; foo.x = 42; '}),
    // may assign to imported namespaces\' names\' members
    test({code: 'import * as foo from \'./bar\'; foo.x.y = 42; '})

    // ensure object literals are not compromised
  , test({code: 'import * as foo from \'./bar\'; var x = {foo: 42}; '})
  , test({code: 'import * as foo from \'./bar\'; var x = {\'foo\': 42}; '})

    // regression check
  , test({ code: 'var [x, y] = ["foo", 42];'
         , ecmaFeatures: { destructuring: true } })
  , test({ code: 'var [, y] = ["foo", 42];'
         , ecmaFeatures: { destructuring: true } })

    // valid destructuring
  , test({ code: 'import * as foo from \'./bar\'; var { foo: bar } = {foo: 42};'
         , ecmaFeatures: { destructuring: true, modules: true } })
  ],

  invalid: [
    // assignment to shadow is invalid
    test({
      code: 'import { foo } from \'./bar\'; function bar(foo) { };',
      errors: [{ message: 'Reassignment of local imported name \'foo\'.'}]}),

    test({
      code: 'import { foo } from \'./bar\'; foo = 42;',
      errors: [{ message: 'Reassignment of local imported name \'foo\'.' }]}),

    test({
      code: 'import foo from \'./bar\'; foo = 42;',
      errors: [{ message: 'Reassignment of local imported name \'foo\'.' }]}),

    test({
      code: 'import * as foo from \'./bar\'; foo = 42;',
      errors: [{ message: 'Reassignment of local imported name \'foo\'.' }]}),

    test({
      code: 'import { foo } from \'./bar\';\nfunction foo() { return false; }',
      errors: [{ message: 'Reassignment of local imported name \'foo\'.' }]}),

    test({
      code: 'import { foo } from \'./bar\';\n' +
            'var bar = 32, foo = function() { return false; }',
      errors: [{ message: 'Reassignment of local imported name \'foo\'.' }]}),

    test({
      code: 'import { foo } from \'./bar\';\nimport { foo } from \'./common\';',
      errors: [{ message: 'Reassignment of local imported name \'foo\'.' }]}),

    test({
      code: 'import { foo } from \'./bar\';\nimport foo from \'./common\';',
      errors: [{ message: 'Reassignment of local imported name \'foo\'.' }]}),

    test({
      code: 'import { foo } from \'./bar\';\nimport * as foo from \'./common\';'
    , errors: [{ message: 'Reassignment of local imported name \'foo\'.' }]}),

    test({
      code: 'import * as foo from \'./bar\'; foo.x = \'y\';',
      errors: [{ message: 'Assignment to member of namespace \'foo\'.'}]}),

    ///////////////////
    // destructuring //
    ///////////////////

    test({
      code: 'import { foo } from \'./bar\'; var { foo } = {foo: \'y\'};',
      errors: [{ message: 'Reassignment of local imported name \'foo\'.'}],
      ecmaFeatures: {modules: true, destructuring: true}}),

    test({
      code: 'import { foo } from \'./bar\'; var { bar: foo } = { bar: \'y\' };',
      errors: [{ message: 'Reassignment of local imported name \'foo\'.'}],
      ecmaFeatures: {modules: true, destructuring: true}}),

    test({
      code: 'import { foo } from \'./bar\'; var [foo] = [\'y\'];',
      errors: [{ message: 'Reassignment of local imported name \'foo\'.'}],
      ecmaFeatures: {modules: true, destructuring: true}}),

    test({
      code: 'import { foo } from \'./bar\'; var [[foo]] = [[\'y\']];',
      errors: [{ message: 'Reassignment of local imported name \'foo\'.'}],
      ecmaFeatures: {modules: true, destructuring: true}}),

    test({
      code: 'import { foo } from \'./bar\'; var [{foo}] = [{foo:\'y\'}];',
      errors: [{ message: 'Reassignment of local imported name \'foo\'.'}],
      ecmaFeatures: {modules: true, destructuring: true}}),

    test({
      code: 'import { foo } from \'./bar\';\n' +
            'var {bar: [foo], 2:baz} = {bar:[\'y\']};',
      errors: [{ message: 'Reassignment of local imported name \'foo\'.'}],
      ecmaFeatures: {modules: true, destructuring: true}}),

    test({
      code: 'import { foo } from \'./bar\'; function bar({foo}) {}',
      errors: [{ message: 'Reassignment of local imported name \'foo\'.'}],
      ecmaFeatures: {modules: true, destructuring: true}})
  ]
})
