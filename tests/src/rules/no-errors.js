// import { test } from '../utils'
// import { RuleTester } from 'eslint'

// var ruleTester = new RuleTester()
//   , rule = require('../../../lib/rules/no-errors')

// ruleTester.run('no-errors', rule, {
//   valid: [
//     test({
//       code: "import Foo from './jsx/FooES7.js';",
//       settings: { 'import/parse-options': {
//         plugins: [
//           'decorators',
//           'jsx',
//           'classProperties',
//           'objectRestSpread',
//         ],
//       }},
//     }),
//   ],

//   invalid: [
//     test({code: "import { a } from './test.coffee';",
//       errors: [{
//         message: "Errors encountered while analysing imported module './test.coffee'.",
//         type: 'Literal',
//       }],
//     }),

//     test({code: "import foo from './malformed.js'",
//       errors: [{
//         message: "Errors encountered while analysing imported module './malformed.js'.",
//         type: 'Literal'}]}),
//     test({code: "import foo from './malformed.js'",
//       args: [2, 'include-messages'],
//       errors: [{type: 'Literal'}]}),
//     test({code: "import foo from './malformed.js'",
//       args: [2, 'include-stack'],
//       errors: [{type: 'Literal'}]}),
//   ],
// })
