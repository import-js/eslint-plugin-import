# No Node.js builtin modules

Forbid the use of Node.js builtin modules. Can be useful for client-side web projects that do not have access to those modules.

### Options

This rule supports the following options:

- `allow`: Array of names of allowed modules. Defaults to an empty array.
- `ignore`: Array of filenames to disable this check on. Useful if some of your files, like config, run in node.js.

## Rule Details

### Fail

```js
import fs from 'fs';
import path from 'path';

var fs = require('fs');
var path = require('path');
```

### Pass

```js
import _ from 'lodash';
import foo from 'foo';
import foo from './foo';

var _ = require('lodash');
var foo = require('foo');
var foo = require('./foo');

/* eslint import/no-nodejs-modules: ["error", {"allow": ["path"]}] */
import path from 'path';

// in `config.js`
/* eslint import/no-nodejs-modules: ["error", {"ignore": ["**\/config*"]}] */
import path from 'path';
```

## When Not To Use It

If you have a project that is run mainly or partially using Node.js.
