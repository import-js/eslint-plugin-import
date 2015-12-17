# no-unresolved

Ensures an imported module can be resolved to a module on the local filesystem,
as defined by standard Node `require.resolve` behavior.

See [settings](../../README.md#settings) for customization options for the resolution (i.e.
additional filetypes, `NODE_PATH`, etc.)

This rule can also optionally report on unresolved modules in CommonJS `require('./foo')` calls and AMD `require(['./foo'], function (foo){...})` and `define(['./foo'], function (foo){...})`.

To enable this, send `{ commonjs: true/false, amd: true/false }` as a rule option.
Both are disabled by default.

If you are using Webpack, see the section on [resolver plugins](../../README.md#resolver-plugins).

## Rule Details

### Options

By default, only ES6 imports will be resolved:

```js
/*eslint import/no-unresolved: 2*/
import x from './foo' // reports if './foo' cannot be resolved on the filesystem
```

If `{commonjs: true}` is provided, single-argument `require` calls will be resolved:

```js
/*eslint import/no-unresolved: [2, { commonjs: true }]*/
const { default: x } = require('./foo') // reported if './foo' is not found

require(0) // ignored
require(['x', 'y'], function (x, y) { /*...*/ }) // ignored
```

Similarly, if `{ amd: true }` is provided, dependency paths for `define` and `require`
calls will be resolved:

```js
/*eslint import/no-unresolved: [2, { amd: true }]*/
define(['./foo'], function (foo) { /*...*/ }) // reported if './foo' is not found
require(['./foo'], function (foo) { /*...*/ }) // reported if './foo' is not found

const { default: x } = require('./foo') // ignored
```

Both may be provided, too:
```js
/*eslint import/no-unresolved: [2, { commonjs: true, amd: true }]*/
const { default: x } = require('./foo') // reported if './foo' is not found
define(['./foo'], function (foo) { /*...*/ }) // reported if './foo' is not found
require(['./foo'], function (foo) { /*...*/ }) // reported if './foo' is not found
```

## When Not To Use It

If you're using a module bundler other than Node or Webpack, you may end up with
a lot of false positive reports of missing dependencies.

## Further Reading

- [Resolver plugins](../../README.md#resolver-plugins)
- [Node resolver](https://npmjs.com/package/eslint-import-resolver-node) (default)
- [Webpack resolver](https://npmjs.com/package/eslint-import-resolver-webpack)
