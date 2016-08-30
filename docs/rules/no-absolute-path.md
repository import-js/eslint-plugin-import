# Forbid import of modules using absolute paths

Node.js allows the import of modules using an absolute path such as `/home/xyz/file.js`. That is a bad practice as it ties the code using it to your computer, and therefore makes it unusable in packages distributed on `npm` for instance.

## Rule Details

### Fail

```js
import f from '/foo';
import f from '/some/path';

var f = require('/foo');
var f = require('/some/path');
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
