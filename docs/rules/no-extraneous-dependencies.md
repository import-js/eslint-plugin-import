# import/no-extraneous-dependencies: Forbid the use of extraneous packages

Forbid the import of external modules that are not declared in the `package.json`'s `dependencies`, `devDependencies`, `optionalDependencies` or `peerDependencies`.
The closest parent `package.json` will be used. If no `package.json` is found, the rule will not lint anything. This behaviour can be changed with the rule option `packageDir`.

Modules have to be installed for this rule to work.

### Options

This rule supports the following options:

`devDependencies`: If set to `false`, then the rule will show an error when `devDependencies` are imported. Defaults to `true`.

`optionalDependencies`: If set to `false`, then the rule will show an error when `optionalDependencies` are imported. Defaults to `true`.

`peerDependencies`: If set to `false`, then the rule will show an error when `peerDependencies` are imported. Defaults to `false`.

You can set the options like this:

```js
"import/no-extraneous-dependencies": ["error", {"devDependencies": false, "optionalDependencies": false, "peerDependencies": false}]
```

You can also use an array of globs instead of literal booleans:

```js
"import/no-extraneous-dependencies": ["error", {"devDependencies": ["**/*.test.js", "**/*.spec.js"]}]
```

When using an array of globs, the setting will be set to `true` (no errors reported) if the name of the file being linted matches a single glob in the array, and `false` otherwise.

Also there is one more option called `packageDir`, this option is to specify the path to the folder containing package.json and is relative to the current working directory.

```js
"import/no-extraneous-dependencies": ["error", {"packageDir": './some-dir/'}]
```

Or, as an array - for when you need this rule to lookup multiple package.json files (for ex, if you are using a monnorepo).
```js
"import/no-extraneous-dependencies": ["error", {"packageDir": ['./some-dir/', './some/other/dir/']}]
```

## Rule Details

Given the following `package.json`:
```json
{
  "name": "my-project",
  "...": "...",
  "dependencies": {
    "builtin-modules": "^1.1.1",
    "lodash.cond": "^4.2.0",
    "lodash.find": "^4.2.0",
    "pkg-up": "^1.0.0"
  },
  "devDependencies": {
    "ava": "^0.13.0",
    "eslint": "^2.4.0",
    "eslint-plugin-ava": "^1.3.0",
    "xo": "^0.13.0"
  },
  "optionalDependencies": {
    "lodash.isarray": "^4.0.0"
  },
  "peerDependencies": {
    "react": ">=15.0.0 <16.0.0"
  }
}
```


## Fail

```js
var _ = require('lodash');
import _ from 'lodash';

import react from 'react';

/* eslint import/no-extraneous-dependencies: ["error", {"devDependencies": false}] */
import test from 'ava';
var test = require('ava');

/* eslint import/no-extraneous-dependencies: ["error", {"optionalDependencies": false}] */
import isArray from 'lodash.isarray';
var isArray = require('lodash.isarray');
```


## Pass

```js
// Builtin and internal modules are fine
var path = require('path');
var foo = require('./foo');

import test from 'ava';
import find from 'lodash.find';
import isArray from 'lodash.isarray';

/* eslint import/no-extraneous-dependencies: ["error", {"peerDependencies": true}] */
import react from 'react';
```


## When Not To Use It

If you do not have a `package.json` file in your project.
