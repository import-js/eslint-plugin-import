var test = require('../utils').test
import { RuleTester } from 'eslint'

var ruleTester = new RuleTester({ env: { es6: true }})
  , rule = require('../../../lib/rules/namespace')


function error(name, namespace) {
  return { message: `'${name}' not found in imported namespace '${namespace}'.` }
}


ruleTester.run('namespace', rule, {
  valid: [
    test({ code: "import * as foo from './empty-folder';"}),
    test({ code: 'import * as names from "./named-exports"; ' +
                 'console.log((names.b).c); ' }),

    test({ code: 'import * as names from "./named-exports"; ' +
                 'console.log(names.a);' }),
    test({ code: 'import * as names from "./re-export-names"; ' +
                 'console.log(names.foo);' }),
    test({ code: "import * as elements from './jsx';"
         , settings: { 'import/parse-options': { plugins: ['jsx'] }}}),
    test({ code: "import * as foo from './common';"
         , settings: { 'import/ignore': ['common'] } }),

    // destructuring namespaces
    test({ code: 'import * as names from "./named-exports";' +
                 'const { a } = names' }),
    test({ code: 'import * as names from "./named-exports";' +
                 'const { d: c } = names' }),
    test({ code: 'import * as names from "./named-exports";' +
                 'const { c } = foo\n' +
                 '    , { length } = "names"\n' +
                 '    , alt = names' }),
    // deep destructuring only cares about top level
    test({ code: 'import * as names from "./named-exports";' +
                 'const { ExportedClass: { length } } = names' }),

    // detect scope redefinition
    test({ code: 'import * as names from "./named-exports";' +
                 'function b(names) { const { c } = names }' }),
    test({ code: 'import * as names from "./named-exports";' +
                 'function b() { let names = null; const { c } = names }' }),
    test({ code: 'import * as names from "./named-exports";' +
                 'const x = function names() { const { c } = names }' }),


    /////////
    // es7 //
    /////////
    test({ code: 'export * as names from "./named-exports"'
         , parser: 'babel-eslint' }),
    test({ code: 'export defport, * as names from "./named-exports"'
         , parser: 'babel-eslint' }),
    // non-existent is handled by no-unresolved
    test({ code: 'export * as names from "./does-not-exist"'
         , parser: 'babel-eslint' }),

    ///////////////////////
    // deep dereferences //
    ///////////////////////

    test({ code: 'import * as a from "./deep/a"; console.log(a.b.c.d.e)' }),
    test({ code: 'import * as a from "./deep/a"; var {b:{c:{d:{e}}}} = a' }),
  ],

  invalid: [
    test({code: "import * as foo from './common';",
          errors: ["No exported names found in module './common'."]}),
    test({code: "import * as names from './default-export';",
          errors: ["No exported names found in module './default-export'."]}),

    test({ code: "import * as names from './named-exports'; " +
                 ' console.log(names.c);'
         , errors: [error('c', 'names')] }),

    test({ code: "import * as names from './named-exports';" +
                 " console.log(names['a']);"
         , errors: 1 }),

    // assignment warning (from no-reassign)
    test({ code: 'import * as foo from \'./bar\'; foo.foo = \'y\';'
         , errors: [{ message: 'Assignment to member of namespace \'foo\'.'}] }),
    test({ code: 'import * as foo from \'./bar\'; foo.x = \'y\';'
         , errors: 2 }),

    // invalid destructuring
    test({ code: 'import * as names from "./named-exports";' +
                 'const { c } = names'
         , errors: [{ type: 'Property' }] }),
    test({ code: 'import * as names from "./named-exports";' +
                 'function b() { const { c } = names }'
         , errors: [{ type: 'Property' }] }),
    test({ code: 'import * as names from "./named-exports";' +
                 'const { c: d } = names'
         , errors: [{ type: 'Property' }] }),
    test({ code: 'import * as names from "./named-exports";' +
                 'const { c: { d } } = names'
         , errors: [{ type: 'Property' }] }),

    /////////
    // es7 //
    /////////
    test({ code: 'export * as names from "./default-export"'
         , parser: 'babel-eslint'
         , errors: 1 }),
    test({ code: 'export defport, * as names from "./default-export"'
         , parser: 'babel-eslint'
         , errors: 1 }),


    // parse errors
    test({
      code: "import * as namespace from './malformed.js';",
      errors: [{
        message: "Parse errors in imported module './malformed.js'.",
        type: 'Literal',
      }],
    }),


    ///////////////////////
    // deep dereferences //
    ///////////////////////
    test({
      code: 'import * as a from "./deep/a"; console.log(a.b.e)',
      errors: [ "'e' not found in deeply imported namespace 'a.b'." ],
    }),
    test({
      code: 'import * as a from "./deep/a"; console.log(a.b.c.e)',
      errors: [ "'e' not found in deeply imported namespace 'a.b.c'." ],
    }),
    test({
      code: 'import * as a from "./deep/a"; var {b:{ e }} = a',
      errors: [ "'e' not found in deeply imported namespace 'a.b'." ],
    }),
    test({
      code: 'import * as a from "./deep/a"; var {b:{c:{ e }}} = a',
      errors: [ "'e' not found in deeply imported namespace 'a.b.c'." ],
    }),
  ],
})
