import { parsers, test } from '../utils';

import { RuleTester } from 'eslint';

const ruleTester = new RuleTester();
const rule = require('rules/no-empty-named-blocks');


function generateSuggestionsTestCases(cases, parser) {
  return cases.map(code => test({
    code,
    parser,
    errors: [{
      suggestions: [
        {
          desc: 'Remove unused import',
          output: '',
        },
        {
          desc: 'Remove empty import block',
          output: `import 'mod';`,
        },
      ],
    }],
  }));
}

ruleTester.run('no-empty-named-blocks', rule, {
  valid: [].concat(
    test({ code: `import 'mod';` }),
    test({ code: `import Default from 'mod';` }),
    test({ code: `import { Named } from 'mod';` }),
    test({ code: `import Default, { Named } from 'mod';` }),
    test({ code: `import * as Namespace from 'mod';` }),

    // Typescript
    parsers.TS_NEW ? [
      test({ code: `import type Default from 'mod';`, parser: parsers.TS_NEW }),
      test({ code: `import type { Named } from 'mod';`, parser: parsers.TS_NEW }),
      test({ code: `import type Default, { Named } from 'mod';`, parser: parsers.TS_NEW }),
      test({ code: `import type * as Namespace from 'mod';`, parser: parsers.TS_NEW }),
    ] : [],

    // Flow
    test({ code: `import typeof Default from 'mod';`, parser: parsers.BABEL_OLD }),
    test({ code: `import typeof { Named } from 'mod';`, parser: parsers.BABEL_OLD }),
    test({ code: `import typeof Default, { Named } from 'mod';`, parser: parsers.BABEL_OLD }),
  ),
  invalid: [].concat(
    test({
      code: `import Default, {} from 'mod';`,
      output: `import Default from 'mod';`,
      errors: ['Unexpected empty named import block'],
    }),
    generateSuggestionsTestCases([
      `import {} from 'mod';`,
      `import{}from'mod';`,
      `import {} from'mod';`,
      `import {}from 'mod';`,
    ]),

    // Typescript
    parsers.TS_NEW ? [].concat(
      generateSuggestionsTestCases(
        [
          `import type {} from 'mod';`,
          `import type {}from 'mod';`,
          `import type{}from 'mod';`,
          `import type {}from'mod';`,
        ],
        parsers.TS_NEW,
      ),
      test({
        code: `import type Default, {} from 'mod';`,
        output: `import type Default from 'mod';`,
        parser: parsers.TS_NEW,
        errors: ['Unexpected empty named import block'],
      }),
    ) : [],

    // Flow
    generateSuggestionsTestCases(
      [
        `import typeof {} from 'mod';`,
        `import typeof {}from 'mod';`,
        `import typeof {} from'mod';`,
        `import typeof{}from'mod';`,
      ],
      parsers.BABEL_OLD,
    ),
    test({
      code: `import typeof Default, {} from 'mod';`,
      output: `import typeof Default from 'mod';`,
      parser: parsers.BABEL_OLD,
      errors: ['Unexpected empty named import block'],
    }),
  ),
});
