# import/default-import-match-filename

Enforces default import name to match filename. Name matching is case-insensitive, and characters `._-` are stripped.

## Rule Details

### Options

#### `ignorePaths`

This option accepts an array of glob patterns. The glob patterns are to be matched against the resolved **abosolute** path of import statements. As an example, with the option `{ignorePaths: ['**/foo.js']}`, the statement `import whatever from './foo.js'` is ignored, since `./foo.js` resolves to, say, `/home/me/thing/foo.js`, which matches the glob pattern `**/foo.js`.

### Fail

```js
import notFoo from './foo';
import utilsFoo from '../utils/foo';
import notFoo from '../foo/index.js';
import notMerge from 'lodash/merge';
import notPackageName from '..'; // When "../package.json" has name "package-name"
import notDirectoryName from '..'; // When ".." is a directory named "directory-name"
const bar = require('./foo');
const bar = require('../foo');
```

### Pass

```js
import foo from './foo';
import foo from '../foo/index.js';
import merge from 'lodash/merge';
import packageName from '..'; // When "../package.json" has name "package-name"
import directoryName from '..'; // When ".." is a directory named "directory-name"
import anything from 'foo';
import foo_ from './foo';
import foo from './foo.js';
import fooBar from './foo-bar';
import FoObAr from './foo-bar';
import catModel from './cat.model.js';
const foo = require('./foo');

// Option `{ ignorePaths: ['**/models/*.js'] }`
import whatever from '../models/foo.js';
```
