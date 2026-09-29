# import/no-self-import

<!-- end auto-generated rule header -->

Forbid a module from importing itself. This can sometimes happen during refactoring.

## Rule Details

### Fail

```js
// foo.js
import foo from './foo';

const foo = require('./foo');
```

```js
// index.js
import index from '.';

const index = require('.');
```

### Pass

```js
// foo.js
import bar from './bar';

const bar = require('./bar');
```

## Options

### requireResolve

When set to `true`, this rule also checks the path argument of `require.resolve()` calls. Defaults to `false`.

```js
"import/no-self-import": ["error", { "requireResolve": true }]
```
