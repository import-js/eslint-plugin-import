import { test } from '../utils';

import { RuleTester } from 'eslint';

const ruleTester = new RuleTester();
const rule = require('rules/enforce-node-protocol-usage');

const preferUsingProtocol = ['always'];
const preferNotUsingProtocol = ['never'];
const useNewerParser = { ecmaVersion: 2021 };

const invalidTests = [
  {
    code: 'import fs from "fs";',
    output: 'import fs from "node:fs";',
    options: preferUsingProtocol,
    errors: [
      { messageId: 'preferNodeBuiltinImports', data: { moduleName: 'fs' } },
    ],
  },
  {
    code: 'export {promises} from "fs";',
    output: 'export {promises} from "node:fs";',
    options: preferUsingProtocol,
    errors: [
      { messageId: 'preferNodeBuiltinImports', data: { moduleName: 'fs' } },
    ],
  },
  {
    code: `
    async function foo() {
      const fs = await import('fs');
    }`,
    output: `
    async function foo() {
      const fs = await import('node:fs');
    }`,
    options: preferUsingProtocol,
    parserOptions: useNewerParser,
    errors: [
      { messageId: 'preferNodeBuiltinImports', data: { moduleName: 'fs' } },
    ],
  },
  {
    code: 'import fs from "fs/promises";',
    output: 'import fs from "node:fs/promises";',
    options: preferUsingProtocol,
    errors: [
      {
        messageId: 'preferNodeBuiltinImports',
        data: { moduleName: 'fs/promises' },
      },
    ],
  },
  {
    code: 'export {default} from "fs/promises";',
    output: 'export {default} from "node:fs/promises";',
    options: preferUsingProtocol,
    errors: [
      {
        messageId: 'preferNodeBuiltinImports',
        data: { moduleName: 'fs/promises' },
      },
    ],
  },
  {
    code: `
    async function foo() {
      const fs = await import('fs/promises');
    }`,
    output: `
    async function foo() {
      const fs = await import('node:fs/promises');
    }`,
    options: preferUsingProtocol,
    parserOptions: useNewerParser,
    errors: [
      {
        messageId: 'preferNodeBuiltinImports',
        data: { moduleName: 'fs/promises' },
      },
    ],
  },
  {
    code: 'import {promises} from "fs";',
    output: 'import {promises} from "node:fs";',
    options: preferUsingProtocol,
    errors: [
      { messageId: 'preferNodeBuiltinImports', data: { moduleName: 'fs' } },
    ],
  },
  {
    code: 'export {default as promises} from "fs";',
    output: 'export {default as promises} from "node:fs";',
    options: preferUsingProtocol,
    errors: [
      { messageId: 'preferNodeBuiltinImports', data: { moduleName: 'fs' } },
    ],
  },
  {
    code: `
    async function foo() {
      const fs = await import("fs/promises");
    }`,
    output: `
    async function foo() {
      const fs = await import("node:fs/promises");
    }`,
    options: preferUsingProtocol,
    parserOptions: useNewerParser,
    errors: [
      {
        messageId: 'preferNodeBuiltinImports',
        data: { moduleName: 'fs/promises' },
      },
    ],
  },
  {
    code: 'import "buffer";',
    output: 'import "node:buffer";',
    options: preferUsingProtocol,
    errors: [
      {
        messageId: 'preferNodeBuiltinImports',
        data: { moduleName: 'buffer' },
      },
    ],
  },
  {
    code: 'import "child_process";',
    output: 'import "node:child_process";',
    options: preferUsingProtocol,
    errors: [
      {
        messageId: 'preferNodeBuiltinImports',
        data: { moduleName: 'child_process' },
      },
    ],
  },
  {
    code: 'import "timers/promises";',
    output: 'import "node:timers/promises";',
    options: preferUsingProtocol,
    errors: [
      {
        messageId: 'preferNodeBuiltinImports',
        data: { moduleName: 'timers/promises' },
      },
    ],
  },
  {
    code: 'const {promises} = require("fs")',
    output: 'const {promises} = require("node:fs")',
    options: preferUsingProtocol,
    errors: [
      { messageId: 'preferNodeBuiltinImports', data: { moduleName: 'fs' } },
    ],
  },
  {
    code: 'const fs = require("fs/promises")',
    output: 'const fs = require("node:fs/promises")',
    options: preferUsingProtocol,
    errors: [
      {
        messageId: 'preferNodeBuiltinImports',
        data: { moduleName: 'fs/promises' },
      },
    ],
  },
];

ruleTester.run('enforce-node-protocol-usage', rule, {
  valid: [
    test({
      code: 'import unicorn from "unicorn";',
      options: preferUsingProtocol,
    }),
    test({ code: 'import fs from "./fs";', options: preferUsingProtocol }),
    test({
      code: 'import fs from "unknown-builtin-module";',
      options: preferUsingProtocol,
    }),
    test({ code: 'import fs from "node:fs";', options: preferUsingProtocol }),
    test({
      code: `
      async function foo() {
        const fs = await import(fs);
      }`,
      options: preferUsingProtocol,
      parserOptions: useNewerParser,
    }),
    test({
      code: `
      async function foo() {
      const fs = await import(0);
      }`,
      options: preferUsingProtocol,
      parserOptions: useNewerParser,
    }),
    test({
      code: `
      async function foo() {
        const fs = await import(\`fs\`);
      }`,
      options: preferUsingProtocol,
      parserOptions: useNewerParser,
    }),
    test({ code: 'import "punycode/";', options: preferUsingProtocol }),
    test({
      code: 'const fs = require("node:fs");',
      options: preferUsingProtocol,
    }),
    test({
      code: 'const fs = require("node:fs/promises");',
      options: preferUsingProtocol,
    }),
    test({ code: 'const fs = require(fs);', options: preferUsingProtocol }),
    test({
      code: 'const fs = notRequire("fs");',
      options: preferUsingProtocol,
    }),
    test({
      code: 'const fs = foo.require("fs");',
      options: preferUsingProtocol,
    }),
    test({
      code: 'const fs = require.resolve("fs");',
      options: preferUsingProtocol,
    }),
    test({ code: 'const fs = require(`fs`);', options: preferUsingProtocol }),
    test({
      code: 'const fs = require?.("fs");',
      parserOptions: useNewerParser,
      options: preferUsingProtocol,
    }),
    test({
      code: 'const fs = require("fs", extra);',
      options: preferUsingProtocol,
    }),
    test({ code: 'const fs = require();', options: preferUsingProtocol }),
    test({
      code: 'const fs = require(...["fs"]);',
      options: preferUsingProtocol,
    }),
    test({
      code: 'const fs = require("unicorn");',
      options: preferUsingProtocol,
    }),
    test({
      code: 'import fs from "fs";',
      options: preferNotUsingProtocol,
    }),
    test({
      code: 'const fs = require("fs");',
      options: preferNotUsingProtocol,
    }),
    test({
      code: 'const fs = require("fs/promises");',
      options: preferNotUsingProtocol,
    }),
    test({ code: 'import "punycode/";', options: preferNotUsingProtocol }),

    // should not report if the module requires `node:` protocol
    test({
      code: 'const fs = require("node:test");',
      options: preferNotUsingProtocol,
    }),
  ],
  invalid: [
    // Prefer using the protocol
    ...invalidTests.map((testCase) => test(testCase)),

    // Prefer not using the protocol: flip the output and code
    ...invalidTests.map((testCase) => test({
      ...testCase,
      code: testCase.output,
      options: preferNotUsingProtocol,
      output: testCase.code,
      errors: [
        {
          messageId: 'neverPreferNodeBuiltinImports',
          data: testCase.errors[0].data,
        },
      ],
    }),
    ),
  ],
});
