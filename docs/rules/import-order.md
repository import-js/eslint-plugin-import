# Enforce a convention in module import order

Enforce a convention in the order of `require()` / `import` statements. The order is as shown in the following example:

```js
// 1. node "builtins"
import fs from 'fs';
import path from 'path';
// 2. "external" modules
import _ from 'lodash';
import chalk from 'chalk';
// 3. modules from a "parent" directory
import foo from '../foo';
import qux from '../../foo/qux';
// 4. "sibling" modules from the same or a sibling's directory
import bar from './bar';
import baz from './bar/baz';
// 5. "index" of the current directory
import main from './';
```

Unassigned imports are not accounted for, as the order they are imported in may be important.


## Fail

```js
import _ from 'lodash';
import path from 'path'; // `path` import should occur before import of `lodash`

// -----

var _ = require('lodash');
var path = require('path'); // `path` import should occur before import of `lodash`
```


## Pass

```js
import path from 'path';
import _ from 'lodash';

// -----

var path = require('path');
var _ = require('lodash');

// -----

// Allowed as ̀`babel-register` is not assigned.
require('babel-register');
var path = require('path');
```

## Options

This rule supports the following options:

`order`: The order to respect. It needs to contain only and all of the following elements: `"builtin", "external", "parent", "sibling", "index"`, which is the default value.

You can set the options like this:

```js
"import-order/import-order": ["error", {"order": ["index", "sibling", "parent", "external", "builtin"]}]
```
