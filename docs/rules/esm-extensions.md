# import/esm-extensions

Check for full path imports (as required by ESM modules).

This rule will flag any relative import paths that do not resolve to a file.

```js
import foo from './my/path/index.js';
```

## Rule Details

The below examples are assuming you have the following directory contents:

```bash
src
 ├ ExampleFile.js
 ├ core
 │  ├ index.js
 │  ├ importType.js
 │  ├ packagePath.js
 │  ├ staticRequire.js
 ├ docsUrl.js
 ├ importDeclaration.js
 ├ index.js

```

and the below code exists within `src/ExampleFile.js`

### Fail

```js
import myModule from '.'; // cjs would import src/index.js
import myModule from './'; // cjs would import src/index.js
import myModule from './index'; // cjs would import src/index.js
import myModule from './index'; // cjs would import src/index.js
import core from './core'; // cjs would import src/core/index.js
import core from './core/index'; // cjs would import src/core/index.js
import packagePath from './core/packagePath'; // cjs would import src/core/packagePath.js
```

### Pass

```js
// This is what the previous failing imports would be fixed to when using `--fix`
import myModule from './index.js'; // This is what the previous failing imports would be fixed to
import core from './core/index.js'; // This is what the previous failing imports would be fixed to
import packagePath from './core/packagePath.js'; // cjs would import src/core/packagePath.js
```

## When Not To Use It

If you're fully migrated to ESM, you probably have other rules to handle this, but this rule could still be used in place of those to flag invalid ESM imports.
