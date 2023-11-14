import { RuleTester } from 'eslint';
import eslintPkg from 'eslint/package.json';
import semver from 'semver';

const EXPORT_MESSAGE = 'Expected "export" or "export default"';
const IMPORT_MESSAGE = 'Expected "import" instead of "require()"';

const ruleTester = new RuleTester({ parserOptions: { ecmaVersion: 2015, sourceType: 'module' } });

ruleTester.run('no-commonjs', require('rules/no-commonjs'), {
  valid: [

    // imports
    { code: 'import "x";', parserOptions: { ecmaVersion: 2015, sourceType: 'module' } },
    { code: 'import x from "x"', parserOptions: { ecmaVersion: 2015, sourceType: 'module' } },
    { code: 'import { x } from "x"', parserOptions: { ecmaVersion: 2015, sourceType: 'module' } },

    // exports
    { code: 'export default "x"', parserOptions: { ecmaVersion: 2015, sourceType: 'module' } },
    { code: 'export function house() {}', parserOptions: { ecmaVersion: 2015, sourceType: 'module' } },
    {
      code: `
        function someFunc() {
          const exports = someComputation();
          expect(exports.someProp).toEqual({ a: 'value' });
        }
      `,
      parserOptions: { ecmaVersion: 2015, sourceType: 'module' },
    },

    // allowed requires
    { code: 'function a() { var x = require("y"); }' }, // nested requires allowed
    { code: 'var a = c && require("b")' }, // conditional requires allowed
    { code: 'require.resolve("help")' }, // methods of require are allowed
    { code: 'require.ensure([])' }, // webpack specific require.ensure is allowed
    { code: 'require([], function(a, b, c) {})' }, // AMD require is allowed
    { code: "var bar = require('./bar', true);" },
    { code: "var bar = proxyquire('./bar');" },
    { code: "var bar = require('./ba' + 'r');" },
    { code: 'var bar = require(`x${1}`);', parserOptions: { ecmaVersion: 2015 } },
    { code: 'var zero = require(0);' },
    { code: 'require("x")', options: [{ allowRequire: true }] },

    // commonJS doesn't care how the path is built. You can use a function to
    // dynamically build the module path.t st
    { code: 'require(rootRequire("x"))', options: [{ allowRequire: true }] },
    { code: 'require(String("x"))', options: [{ allowRequire: true }] },
    { code: 'require(["x", "y", "z"].join("/"))', options: [{ allowRequire: true }] },

    // commonJS rules should be scoped to commonJS spec. `rootRequire` is not
    // recognized by this commonJS plugin.
    { code: 'rootRequire("x")', options: [{ allowRequire: true }] },
    { code: 'rootRequire("x")', options: [{ allowRequire: false }] },

    { code: 'module.exports = function () {}', options: ['allow-primitive-modules'] },
    { code: 'module.exports = function () {}', options: [{ allowPrimitiveModules: true }] },
    { code: 'module.exports = "foo"', options: ['allow-primitive-modules'] },
    { code: 'module.exports = "foo"', options: [{ allowPrimitiveModules: true }] },

    { code: 'if (typeof window !== "undefined") require("x")', options: [{ allowRequire: true }] },
    { code: 'if (typeof window !== "undefined") require("x")', options: [{ allowRequire: false }] },
    { code: 'if (typeof window !== "undefined") { require("x") }', options: [{ allowRequire: true }] },
    { code: 'if (typeof window !== "undefined") { require("x") }', options: [{ allowRequire: false }] },

    { code: 'try { require("x") } catch (error) {}' },
  ],

  invalid: [

    // imports
    ...semver.satisfies(eslintPkg.version, '< 4.0.0') ? [] : [
      { code: 'var x = require("x")', output: 'var x = require("x")', errors: [{ message: IMPORT_MESSAGE }] },
      { code: 'x = require("x")', output: 'x = require("x")', errors: [{ message: IMPORT_MESSAGE }] },
      { code: 'require("x")', output: 'require("x")', errors: [{ message: IMPORT_MESSAGE }] },
      { code: 'require(`x`)',
        parserOptions: { ecmaVersion: 2015 },
        output: 'require(`x`)',
        errors: [{ message: IMPORT_MESSAGE }],
      },

      { code: 'if (typeof window !== "undefined") require("x")',
        options: [{ allowConditionalRequire: false }],
        output: 'if (typeof window !== "undefined") require("x")',
        errors: [{ message: IMPORT_MESSAGE }],
      },
      { code: 'if (typeof window !== "undefined") { require("x") }',
        options: [{ allowConditionalRequire: false }],
        output: 'if (typeof window !== "undefined") { require("x") }',
        errors: [{ message: IMPORT_MESSAGE }],
      },
      { code: 'try { require("x") } catch (error) {}',
        options: [{ allowConditionalRequire: false }],
        output: 'try { require("x") } catch (error) {}',
        errors: [{ message: IMPORT_MESSAGE }],
      },
    ],

    // exports
    { code: 'exports.face = "palm"', output: 'exports.face = "palm"', errors: [{ message: EXPORT_MESSAGE }] },
    { code: 'module.exports.face = "palm"', output: 'module.exports.face = "palm"', errors: [{ message: EXPORT_MESSAGE }] },
    { code: 'module.exports = face', output: 'module.exports = face', errors: [{ message: EXPORT_MESSAGE }] },
    { code: 'exports = module.exports = {}', output: 'exports = module.exports = {}', errors: [{ message: EXPORT_MESSAGE }] },
    { code: 'var x = module.exports = {}', output: 'var x = module.exports = {}', errors: [{ message: EXPORT_MESSAGE }] },
    { code: 'module.exports = {}',
      options: ['allow-primitive-modules'],
      output: 'module.exports = {}',
      errors: [{ message: EXPORT_MESSAGE }],
    },
    { code: 'var x = module.exports',
      options: ['allow-primitive-modules'],
      output: 'var x = module.exports',
      errors: [{ message: EXPORT_MESSAGE }],
    },
  ],
});
