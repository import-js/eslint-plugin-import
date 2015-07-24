var linter = require('eslint').linter,
    ESLintTester = require('eslint-tester')

var eslintTester = new ESLintTester(linter)

var test = require('../../utils').test

function error(name, namespace) {
  return { message: `'${name}' not found in imported namespace ${namespace}.` }
}


eslintTester.addRuleTest('src/rules/namespace', {
  valid: [
    test({ code: "import * as foo from './empty-folder';"}),
    test({ code: 'import * as names from "./named-exports"; ' +
                 'console.log((names.b).c); '
         }),

    test({ code: 'import * as names from "./named-exports"; ' +
                 'console.log(names.a);'
         }),
    test({ code: 'import * as names from "./re-export-names"; ' +
                 'console.log(names.foo);'
         }),
    test({ code: "import * as elements from './jsx';"}),
    test({ code: "import * as foo from './common';"
         , settings: { 'import/ignore': ['common'] }
         })

    /////////
    // es7 //
    /////////
  , test({ code: 'export * as names from "./named-exports"'
         , parser: 'babel-eslint'
         })
  , test({ code: 'export defport, * as names from "./named-exports"'
         , parser: 'babel-eslint'
         })
    // non-existent is handled by no-unresolved
  , test({ code: 'export * as names from "./does-not-exist"'
         , parser: 'babel-eslint'
         })
  ],

  invalid: [
    test({code: "import * as foo from './common';",
          errors: ["No exported names found in module './common'."]}),
    test({code: "import * as names from './default-export';",
          errors: ["No exported names found in module './default-export'."]}),

    test({ code: "import * as names from './named-exports'; " +
                 ' console.log(names.c);'
         , errors: [error('c', 'names')]
         }),

    test({ code: "import * as names from './named-exports';" +
                 " console.log(names['a']);"
         , errors: 1
         })

    // assignment warning (from no-reassign)
  , test({ code: 'import * as foo from \'./bar\'; foo.foo = \'y\';'
         , errors: [{ message: 'Assignment to member of namespace \'foo\'.'}]
         })
  , test({ code: 'import * as foo from \'./bar\'; foo.x = \'y\';'
         , errors: 2
         })

    /////////
    // es7 //
    /////////
  , test({ code: 'export * as names from "./default-export"'
         , parser: 'babel-eslint'
         , errors: 1
         })
  , test({ code: 'export defport, * as names from "./default-export"'
         , parser: 'babel-eslint'
         , errors: 1
         })
  ]
})
