# No Node.js builtin modules

Forbid the use of Node.js builtin modules. Can be useful for client-side web projects that do not have access to those modules.

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
```

## When Not To Use It

If you have a project that is run mainly or partially using Node.js.
