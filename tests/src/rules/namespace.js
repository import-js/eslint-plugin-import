var test = require('../utils').test
import { RuleTester } from 'eslint'

var ruleTester = new RuleTester({ env: { es6: true }})
  , rule = require('rules/namespace')


function error(name, namespace) {
  return { message: `'${name}' not found in imported namespace '${namespace}'.` }
}

const valid = [
  test({ code: "import * as foo from './empty-folder';"}),
  test({ code: 'import * as names from "./named-exports"; ' +
               'console.log((names.b).c); ' }),

  test({ code: 'import * as names from "./named-exports"; ' +
               'console.log(names.a);' }),
  test({ code: 'import * as names from "./re-export-names"; ' +
               'console.log(names.foo);' }),
  test({
    code: "import * as elements from './jsx';",
    parserOptions: {
      sourceType: 'module',
      ecmaFeatures: { jsx: true },
    },
  }),
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
]

const invalid = [
  test({code: "import * as foo from './common';",
        errors: ["No exported names found in module './common'."]}),
  test({code: "import * as names from './default-export';",
        errors: ["No exported names found in module './default-export'."]}),

  test({ code: "import * as names from './named-exports'; " +
               ' console.log(names.c);'
       , errors: [error('c', 'names')] }),

  test({ code: "import * as names from './named-exports';" +
               " console.log(names['a']);"
       , errors: ["Unable to validate computed reference to imported namespace 'names'."] }),

  // assignment warning (from no-reassign)
  test({ code: 'import * as foo from \'./bar\'; foo.foo = \'y\';'
       , errors: [{ message: 'Assignment to member of namespace \'foo\'.'}] }),
  test({ code: 'import * as foo from \'./bar\'; foo.x = \'y\';'
       , errors: ['Assignment to member of namespace \'foo\'.', "'x' not found in imported namespace 'foo'."] }),

  // invalid destructuring
  test({
    code: 'import * as names from "./named-exports"; const { c } = names',
    errors: [{ type: 'Property', message: "'c' not found in imported namespace 'names'." }],
  }),
  test({
    code: 'import * as names from "./named-exports"; function b() { const { c } = names }',
    errors: [{ type: 'Property', message: "'c' not found in imported namespace 'names'." }],
  }),
  test({
    code: 'import * as names from "./named-exports"; const { c: d } = names',
    errors: [{ type: 'Property', message: "'c' not found in imported namespace 'names'." }],
  }),
  test({
    code: 'import * as names from "./named-exports";' +
           'const { c: { d } } = names',
    errors: [{ type: 'Property', message: "'c' not found in imported namespace 'names'." }],
  }),

  /////////
  // es7 //
  /////////
  test({ code: 'export * as names from "./default-export"'
       , parser: 'babel-eslint'
       , errors: ["No exported names found in module './default-export'."] }),
  test({ code: 'export defport, * as names from "./default-export"'
       , parser: 'babel-eslint'
       , errors: ["No exported names found in module './default-export'."] }),

  // parse errors
  test({
    code: "import * as namespace from './malformed.js';",
    errors: [{
      message: "Parse errors in imported module './malformed.js': 'return' outside of function (1:1)",
      type: 'Literal',
    }],
  }),

]

///////////////////////
// deep dereferences //
//////////////////////
;[['deep', 'espree'], ['deep-es7', 'babel-eslint']].forEach(function ([folder, parser]) { // close over params
  valid.push(
    test({ parser, code: `import * as a from "./${folder}/a"; console.log(a.b.c.d.e)` }),
    test({ parser, code: `import * as a from "./${folder}/a"; console.log(a.b.c.d.e.f)` }),
    test({ parser, code: `import * as a from "./${folder}/a"; var {b:{c:{d:{e}}}} = a` }))

  invalid.push(
    test({
      parser,
      code: `import * as a from "./${folder}/a"; console.log(a.b.e)`,
      errors: [ "'e' not found in deeply imported namespace 'a.b'." ],
    }),
    test({
      parser,
      code: `import * as a from "./${folder}/a"; console.log(a.b.c.e)`,
      errors: [ "'e' not found in deeply imported namespace 'a.b.c'." ],
    }),
    test({
      parser,
      code: `import * as a from "./${folder}/a"; var {b:{ e }} = a`,
      errors: [ "'e' not found in deeply imported namespace 'a.b'." ],
    }),
    test({
      parser,
      code: `import * as a from "./${folder}/a"; var {b:{c:{ e }}} = a`,
      errors: [ "'e' not found in deeply imported namespace 'a.b.c'." ],
    }))
})

ruleTester.run('namespace', rule, { valid, invalid })
