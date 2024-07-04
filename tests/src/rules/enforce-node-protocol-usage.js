import { RuleTester } from '../rule-tester';
import flatMap from 'array.prototype.flatmap';
import { satisfies } from 'semver';

import { test, testVersion } from '../utils';

const ruleTester = new RuleTester();
const rule = require('rules/enforce-node-protocol-usage');

const preferUsingProtocol = ['always'];
const preferNotUsingProtocol = ['never'];
const useNewerParser = { ecmaVersion: 2021 };

const actualModules = ['fs', 'fs/promises', 'buffer', 'child_process', 'timers/promises'];

const settings = {
  'import/node-version': '16.0.0', // the node: prefix is only available as of `^14.18 || >= 16`
};

const invalidTests = [].concat(
  flatMap(actualModules, (moduleName) => [].concat(
    {
      code: `import x from "${moduleName}";`,
      output: `import x from "node:${moduleName}";`,
      options: preferUsingProtocol,
      errors: [
        { messageId: 'requireNodeProtocol', data: { moduleName } },
      ],
    },
    {
      code: `export {promises} from "${moduleName}";`,
      output: `export {promises} from "node:${moduleName}";`,
      options: preferUsingProtocol,
      errors: [
        { messageId: 'requireNodeProtocol', data: { moduleName } },
      ],
    },
    testVersion('>= 7', () => ({
      code: `
        async function foo() {
          const x = await import('${moduleName}');
        }
      `,
      output: `
        async function foo() {
          const x = await import('node:${moduleName}');
        }
      `,
      options: preferUsingProtocol,
      parserOptions: useNewerParser,
      errors: [
        { messageId: 'requireNodeProtocol', data: { moduleName } },
      ],
    })),
  )),

  {
    code: 'import fs from "fs/promises";',
    output: 'import fs from "node:fs/promises";',
    options: preferUsingProtocol,
    errors: [
      {
        messageId: 'requireNodeProtocol',
        data: { moduleName: 'fs/promises' },
      },
    ],
    settings,
  },
  {
    code: 'export {default} from "fs/promises";',
    output: 'export {default} from "node:fs/promises";',
    options: preferUsingProtocol,
    errors: [
      {
        messageId: 'requireNodeProtocol',
        data: { moduleName: 'fs/promises' },
      },
    ],
    settings,
  },
  testVersion('>= 7', () => ({
    code: `
      async function foo() {
        const fs = await import('fs/promises');
      }
    `,
    output: `
      async function foo() {
        const fs = await import('node:fs/promises');
      }
    `,
    options: preferUsingProtocol,
    parserOptions: useNewerParser,
    errors: [
      {
        messageId: 'requireNodeProtocol',
        data: { moduleName: 'fs/promises' },
      },
    ],
    settings,
  })),
  {
    code: 'import {promises} from "fs";',
    output: 'import {promises} from "node:fs";',
    options: preferUsingProtocol,
    errors: [
      { messageId: 'requireNodeProtocol', data: { moduleName: 'fs' } },
    ],
  },
  {
    code: 'export {default as promises} from "fs";',
    output: 'export {default as promises} from "node:fs";',
    options: preferUsingProtocol,
    errors: [
      { messageId: 'requireNodeProtocol', data: { moduleName: 'fs' } },
    ],
  },
  testVersion('>= 7', () => ({
    code: `
      async function foo() {
        const fs = await import("fs/promises");
      }
    `,
    output: `
      async function foo() {
        const fs = await import("node:fs/promises");
      }
    `,
    options: preferUsingProtocol,
    parserOptions: useNewerParser,
    errors: [
      {
        messageId: 'requireNodeProtocol',
        data: { moduleName: 'fs/promises' },
      },
    ],
    settings,
  })),
  {
    code: 'import "buffer";',
    output: 'import "node:buffer";',
    options: preferUsingProtocol,
    errors: [
      {
        messageId: 'requireNodeProtocol',
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
        messageId: 'requireNodeProtocol',
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
        messageId: 'requireNodeProtocol',
        data: { moduleName: 'timers/promises' },
      },
    ],
    settings,
  },
  {
    code: 'const {promises} = require("fs")',
    output: 'const {promises} = require("node:fs")',
    options: preferUsingProtocol,
    errors: [
      { messageId: 'requireNodeProtocol', data: { moduleName: 'fs' } },
    ],
  },
  {
    code: 'const fs = require("fs/promises")',
    output: 'const fs = require("node:fs/promises")',
    options: preferUsingProtocol,
    errors: [
      {
        messageId: 'requireNodeProtocol',
        data: { moduleName: 'fs/promises' },
      },
    ],
    settings,
  },
);

ruleTester.run('enforce-node-protocol-usage', rule, {
  valid: [].concat(
    test({
      code: 'import unicorn from "unicorn";',
      options: preferUsingProtocol,
    }),
    test({
      code: 'import fs from "./fs";',
      options: preferUsingProtocol,
    }),
    test({
      code: 'import fs from "unknown-builtin-module";',
      options: preferUsingProtocol,
    }),
    test({
      code: 'import fs from "node:fs";',
      options: preferUsingProtocol,
    }),
    testVersion('>= 7', () => ({
      code: `
        async function foo() {
          const fs = await import(fs);
        }
      `,
      options: preferUsingProtocol,
      parserOptions: useNewerParser,
    })),
    testVersion('>= 7', () => ({
      code: `
        async function foo() {
          const fs = await import(0);
        }
      `,
      options: preferUsingProtocol,
      parserOptions: useNewerParser,
    })),
    testVersion('>= 7', () => ({
      code: `
        async function foo() {
          const fs = await import(\`fs\`);
        }
      `,
      options: preferUsingProtocol,
      parserOptions: useNewerParser,
    })),
    test({
      code: 'import "punycode/";',
      options: preferUsingProtocol,
    }),
    test({
      code: 'const fs = require("node:fs");',
      options: preferUsingProtocol,
    }),
    test({
      code: 'const fs = require("node:fs/promises");',
      options: preferUsingProtocol,
      settings,
    }),
    test({
      code: 'const fs = require(fs);',
      options: preferUsingProtocol,
    }),
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
    test({
      code: 'const fs = require(`fs`);',
      options: preferUsingProtocol,
    }),
    testVersion('>= 7', () => ({
      code: 'const fs = require?.("fs");',
      parserOptions: useNewerParser,
      options: preferUsingProtocol,
    })),
    test({
      code: 'const fs = require("fs", extra);',
      options: preferUsingProtocol,
    }),
    test({
      code: 'const fs = require();',
      options: preferUsingProtocol,
    }),
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
      settings,
    }),
    test({
      code: 'import "punycode/";',
      options: preferNotUsingProtocol,
    }),

    // should not report if the module requires `node:` protocol
    test({
      code: 'const fs = require("node:test");',
      options: preferNotUsingProtocol,
      settings,
    }),
  ),

  invalid: [].concat(
    // Prefer using the protocol
    // in node versions without `node:`, the rule should not report
    satisfies('^14.18 || >= 16') ? invalidTests.map((testCase) => test({
      ...testCase,
      errors: testCase.errors.map(({ messageId, data, ...testCase }) => ({
        ...testCase,
        message: rule.meta.messages[messageId].replace(/{{moduleName}}/g, data.moduleName),
      })),
    })) : [],

    // Prefer not using the protocol: flip the output and code
    invalidTests.map((testCase) => test({
      ...testCase,
      code: testCase.output,
      options: preferNotUsingProtocol,
      output: testCase.code,
      // eslint-disable-next-line no-unused-vars
      errors: testCase.errors.map(({ messageId, data, ...testCase }) => ({
        ...testCase,
        message: rule.meta.messages.forbidNodeProtocol.replace(/{{moduleName}}/g, data.moduleName),
      })),
      settings,
    })),
  ),
});
