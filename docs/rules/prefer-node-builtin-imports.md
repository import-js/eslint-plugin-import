# import/prefer-node-builtin-imports

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

Reports when there is no `node:` protocol for builtin modules.

```ts
import path from "node:path";
```

## Rule Details

This rule enforces that builtins node imports are using `node:` protocol. It resolved the conflict of a module (npm-installed) in `node_modules` overriding the built-in module. Besides that, it is also clear that a built-in Node.js module is imported.

## Examples

❌ Invalid

```ts
import fs from "fs";
export { promises } from "fs";
// require
const fs = require("fs/promises");
```

✅ Valid

```ts
import fs from "node:fs";
export { promises } from "node:fs";
// require
const fs = require("node:fs/promises");
```

## When Not To Use It

If you are using browser or Bun or Deno since this rule doesn't do anything with them.
