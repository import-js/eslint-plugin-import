import { test } from '../utils';

import { RuleTester } from 'eslint';

const ruleTester = new RuleTester();
const rule = require('rules/prefer-node-builtin-imports');

ruleTester.run('prefer-node-builtin-imports', rule, {
  valid: [
    test({ code: 'import unicorn from "unicorn";' }),
    test({ code: 'import fs from "./fs";' }),
    test({ code: 'import fs from "unknown-builtin-module";' }),
    test({ code: 'import fs from "node:fs";' }),
    test({
      code: `
      async function foo() {
        const fs = await import(fs);
      }`,
    }),
    test({
      code: `
      async function foo() {
    	const fs = await import(0);
      }`,
    }),
    test({
      code: `
    	async function foo() {
    		const fs = await import(\`fs\`);
    	}`,
    }),
    test({ code: 'import "punycode/";' }),
    test({ code: 'const fs = require("node:fs");' }),
    test({ code: 'const fs = require("node:fs/promises");' }),
    test({ code: 'const fs = require(fs);' }),
    test({ code: 'const fs = notRequire("fs");' }),
    test({ code: 'const fs = foo.require("fs");' }),
    test({ code: 'const fs = require.resolve("fs");' }),
    test({ code: 'const fs = require(`fs`);' }),
    test({ code: 'const fs = require?.("fs");' }),
    test({ code: 'const fs = require("fs", extra);' }),
    test({ code: 'const fs = require();' }),
    test({ code: 'const fs = require(...["fs"]);' }),
    test({ code: 'const fs = require("unicorn");' }),
  ],
  invalid: [
    test({ code: 'import fs from "fs";' }),
    test({ code: 'export {promises} from "fs";' }),
    test({
      code: `
    	async function foo() {
    		const fs = await import('fs');
    	}`,
    }),
    test({ code: 'import fs from "fs/promises";' }),
    test({ code: 'export {default} from "fs/promises";' }),
    test({
      code: `
        async function foo() {
    	    const fs = await import('fs/promises');
       }`,
    }),
    test({ code: 'import {promises} from "fs";' }),
    test({ code: 'export {default as promises} from "fs";' }),
    test({
      code: `
        async function foo() {
    		const fs = await import("fs/promises");
    	}`,
    }),
    test({
      code: `
        async function foo() {
    		const fs = await import(/* escaped */"\\u{66}s/promises");
    	`,
    }),
    test({ code: 'import "buffer";' }),
    test({ code: 'import "child_process";' }),
    test({ code: 'import "timers/promises";' }),
    test({ code: 'const {promises} = require("fs")' }),
    test({ code: 'const fs = require("fs/promises")' }),
  ],
});
