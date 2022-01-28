import { test, SYNTAX_CASES, getTSParsers, testVersion, testFilePath, parsers, getBabelParsers, getBabelParserConfig, babelSyntaxPlugins } from '../utils';
import { RuleTester } from 'eslint';
import flatMap from 'array.prototype.flatmap';

const ruleTester = new RuleTester({ env: { es6: true } });
const rule = require('rules/namespace');

function error(name, namespace) {
  return { message: `'${name}' not found in imported namespace '${namespace}'.` };
}

const valid = [
  test({ code: 'import "./malformed.js"' }),

  test({ code: "import * as foo from './empty-folder';" }),
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
      ecmaVersion: 2015,
    },
  }),
  test({ code: "import * as foo from './common';" }),

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


  // respect hoisting
  test({
    code:
      'function x() { console.log((names.b).c); } ' +
      'import * as names from "./named-exports"; ',
  }),

  // names.default is valid export
  test({ code: "import * as names from './default-export';" }),
  test({ code: "import * as names from './default-export'; console.log(names.default)" }),

  // #456: optionally ignore computed references
  test({
    code: `import * as names from './named-exports'; console.log(names['a']);`,
    options: [{ allowComputed: true }],
  }),

  // #656: should handle object-rest properties
  test({
    code: `import * as names from './named-exports'; const {a, b, ...rest} = names;`,
    parserOptions: {
      ecmaVersion: 2018,
    },
  }),

  // #1144: should handle re-export CommonJS as namespace
  test({
    code: `import * as ns from './re-export-common'; const {foo} = ns;`,
  }),

  // JSX
  test({
    code: 'import * as Names from "./named-exports"; const Foo = <Names.a/>',
    parserOptions: {
      ecmaFeatures: {
        jsx: true,
      },
    },
  }),

  // Typescript
  ...flatMap(getTSParsers(), (parser) => [
    test({
      code: `
        import * as foo from "./typescript-declare-nested"
        foo.bar.MyFunction()
      `,
      parser,
      settings: {
        'import/parsers': { [parser]: ['.ts'] },
        'import/resolver': { 'eslint-import-resolver-typescript': true },
      },
    }),

    test({
      code: `import { foobar } from "./typescript-declare-interface"`,
      parser,
      settings: {
        'import/parsers': { [parser]: ['.ts'] },
        'import/resolver': { 'eslint-import-resolver-typescript': true },
      },
    }),

    test({
      code: 'export * from "typescript/lib/typescript.d"',
      parser,
      settings: {
        'import/parsers': { [parser]: ['.ts'] },
        'import/resolver': { 'eslint-import-resolver-typescript': true },
      },
    }),

    test({
      code: 'export = function name() {}',
      parser,
      settings: {
        'import/parsers': { [parser]: ['.ts'] },
        'import/resolver': { 'eslint-import-resolver-typescript': true },
      },
    }),
  ]),

  ...SYNTAX_CASES,

  test({
    code: `
    import * as color from './color';
    export const getBackgroundFromColor = (color) => color.bg;
    export const getExampleColor = () => color.example
    `,
  }),

  ...[].concat(testVersion('>= 6', () => ({
    code: `
      import * as middle from './middle';

      console.log(middle.myName);
    `,
    filename: testFilePath('export-star-2/downstream.js'),
    parserOptions: {
      ecmaVersion: 2020,
    },
  })),
  // es2022: Arbitrary module namespace identifier names
  testVersion('>= 8.7', () => ({
    code: "import * as names from './default-export-string';",
    parserOptions: { ecmaVersion: 2022 },
  })),
  testVersion('>= 8.7', () => ({
    code: "import * as names from './default-export-string'; console.log(names.default)",
    parserOptions: { ecmaVersion: 2022 },
  })),
  testVersion('>= 8.7', () => ({
    code: "import * as names from './default-export-namespace-string';",
    parserOptions: { ecmaVersion: 2022 },
  })),
  testVersion('>= 8.7', () => ({
    code: "import * as names from './default-export-namespace-string'; console.log(names.default)",
    parserOptions: { ecmaVersion: 2022 },
  })),
  testVersion('>= 8.7', () => ({
    code: `import { "b" as b } from "./deep/a"; console.log(b.c.d.e)`,
    parserOptions: { ecmaVersion: 2022 },
  })),
  testVersion('>= 8.7', () => ({
    code: `import { "b" as b } from "./deep/a"; var {c:{d:{e}}} = b`,
    parserOptions: { ecmaVersion: 2022 },
  }))),
];

const invalid = [].concat(
  test({ code: "import * as names from './named-exports'; " +
               ' console.log(names.c);',
  errors: [error('c', 'names')] }),

  test({ code: "import * as names from './named-exports';" +
               " console.log(names['a']);",
  errors: ["Unable to validate computed reference to imported namespace 'names'."] }),

  // assignment warning (from no-reassign)
  test({ code: 'import * as foo from \'./bar\'; foo.foo = \'y\';',
    errors: [{ message: 'Assignment to member of namespace \'foo\'.' }] }),
  test({ code: 'import * as foo from \'./bar\'; foo.x = \'y\';',
    errors: ['Assignment to member of namespace \'foo\'.', "'x' not found in imported namespace 'foo'."] }),

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

  // parse errors
  test({
    code: "import * as namespace from './malformed.js';",
    errors: [{
      message: "Parse errors in imported module './malformed.js': 'return' outside of function (1:1)",
      type: 'Literal',
    }],
  }),

  test({
    code: "import b from './deep/default'; console.log(b.e)",
    errors: [ "'e' not found in imported namespace 'b'." ],
  }),

  // respect hoisting
  test({
    code:
      'console.log(names.c);' +
      "import * as names from './named-exports'; ",
    errors: [error('c', 'names')],
  }),
  test({
    code:
      'function x() { console.log(names.c) } ' +
      "import * as names from './named-exports'; ",
    errors: [error('c', 'names')],
  }),

  // #328: * exports do not include default
  test({
    code: 'import * as ree from "./re-export"; console.log(ree.default)',
    errors: [`'default' not found in imported namespace 'ree'.`],
  }),

  // JSX
  test({
    code: 'import * as Names from "./named-exports"; const Foo = <Names.e/>',
    errors: [error('e', 'Names')],
    parserOptions: {
      ecmaFeatures: {
        jsx: true,
      },
    },
  }),

  // es2022: Arbitrary module namespace identifier names
  testVersion('>= 8.7', () => ({
    code: `import { "b" as b } from "./deep/a"; console.log(b.e)`,
    errors: [ "'e' not found in imported namespace 'b'." ],
    parserOptions: { ecmaVersion: 2022 },
  })),
  testVersion('>= 8.7', () => ({
    code: `import { "b" as b } from "./deep/a"; console.log(b.c.e)`,
    errors: [ "'e' not found in deeply imported namespace 'b.c'." ],
    parserOptions: { ecmaVersion: 2022 },
  })),
);

getBabelParsers().forEach((parser) => {
  const parserConfig = getBabelParserConfig(
    parser, { plugins: [babelSyntaxPlugins.exportDefaultFrom] },
  );
  valid.push(
    /////////
    // es7 //
    /////////
    test({ code: 'export * as names from "./named-exports"', ...parserConfig }),
    test({ code: 'export defport, * as names from "./named-exports"', ...parserConfig }),

    // non-existent is handled by no-unresolved
    test({ code: 'export * as names from "./does-not-exist"', ...parserConfig }),
    test({
      code: 'import * as Endpoints from "./issue-195/Endpoints"; console.log(Endpoints.Users)',
      ...parserConfig,
    }),

    // names.default is valid export
    test({
      code: 'export * as names from "./default-export"',
      ...parserConfig,
    }),
    test({
      code: 'export defport, * as names from "./default-export"',
      ...parserConfig,
    }),

    // #656: should handle object-rest properties
    test({
      code: `import * as names from './named-exports'; const {a, b, ...rest} = names;`,
      ...parserConfig,
    }),
  );

  invalid.push(
    /////////
    // es7 //
    /////////
    test({
      code: 'import * as Endpoints from "./issue-195/Endpoints"; console.log(Endpoints.Foo)',
      errors: ["'Foo' not found in imported namespace 'Endpoints'."],
      ...parserConfig,
    }),
  );
})

///////////////////////
// deep dereferences //
//////////////////////
;[['deep', require.resolve('espree')], ['deep-es7', parsers.BABEL_OLD], ['deep', parsers.BABEL_NEW]].forEach(function ([folder, parser]) { // close over params
  const parserConfig = getBabelParserConfig(parser);
  valid.push(
    test({ code: `import * as a from "./${folder}/a"; console.log(a.b.c.d.e)`, ...parserConfig }),
    test({ code: `import { b } from "./${folder}/a"; console.log(b.c.d.e)`, ...parserConfig }),
    test({ code: `import * as a from "./${folder}/a"; console.log(a.b.c.d.e.f)`, ...parserConfig }),
    test({ code: `import * as a from "./${folder}/a"; var {b:{c:{d:{e}}}} = a`, ...parserConfig }),
    test({ code: `import { b } from "./${folder}/a"; var {c:{d:{e}}} = b`, ...parserConfig }));

  // deep namespaces should include explicitly exported defaults
  test({ code: `import * as a from "./${folder}/a"; console.log(a.b.default)`, ...parserConfig }),

  invalid.push(
    test({
      code: `import * as a from "./${folder}/a"; console.log(a.b.e)`,
      errors: [ "'e' not found in deeply imported namespace 'a.b'." ],
      ...parserConfig,
    }),
    test({
      code: `import { b } from "./${folder}/a"; console.log(b.e)`,
      errors: [ "'e' not found in imported namespace 'b'." ],
      ...parserConfig,
    }),
    test({
      code: `import * as a from "./${folder}/a"; console.log(a.b.c.e)`,
      errors: [ "'e' not found in deeply imported namespace 'a.b.c'." ],
      ...parserConfig,
    }),
    test({
      code: `import { b } from "./${folder}/a"; console.log(b.c.e)`,
      errors: [ "'e' not found in deeply imported namespace 'b.c'." ],
      ...parserConfig,
    }),
    test({
      code: `import * as a from "./${folder}/a"; var {b:{ e }} = a`,
      errors: [ "'e' not found in deeply imported namespace 'a.b'." ],
      ...parserConfig,
    }),
    test({
      code: `import * as a from "./${folder}/a"; var {b:{c:{ e }}} = a`,
      errors: [ "'e' not found in deeply imported namespace 'a.b.c'." ],
      ...parserConfig,
    }));
});

ruleTester.run('namespace', rule, { valid, invalid });
