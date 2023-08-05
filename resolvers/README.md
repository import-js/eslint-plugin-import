# Resolver spec (v2)

Resolvers must export two names:

### `interfaceVersion => Number`

This document currently describes version 2 of the resolver interface. As such, a resolver implementing this version should

```js
export const interfaceVersion = 2
```
or
```js
exports.interfaceVersion = 2
```

To the extent it is feasible, trailing versions of the resolvers will continue to be supported, at least until a major version bump on the plugin proper.

Currently, version 1 is assumed if no `interfaceVersion` is available. (didn't think to define it until v2, heh. 😅)

### `resolve(source, file, config) => { found: Boolean, path: String? }`

Given:
```js
// /some/path/to/module.js
import ... from './imported-file'
```

and

```yaml
# .eslintrc.yml
---
settings:
  import/resolver:
    my-cool-resolver: [some, stuff]
    node: { paths: [a, b, c] }
```

#### Arguments

The arguments provided will be:

##### `source`
the module identifier (`./imported-file`).

##### `file`
the absolute path to the file making the import (`/some/path/to/module.js`)

##### `config`

an object provided via the `import/resolver` setting. `my-cool-resolver` will get `["some", "stuff"]` as its `config`, while
  `node` will get `{ "paths": ["a", "b", "c"] }` provided as `config`.

#### Return value

The first resolver to return `{found: true}` is considered the source of truth. The returned object has:

- `found`: `true` if the `source` module can be resolved relative to `file`, else `false`
- `path`: an absolute path `String` if the module can be located on the filesystem; else, `null`.

An example of a `null` path is a Node core module, such as `fs` or `crypto`. These modules can always be resolved, but the path need not be provided as the plugin will not attempt to parse core modules at this time.

If the resolver cannot resolve `source` relative to `file`, it should just return `{ found: false }`. No `path` key is needed in this case.

## Example

Here is most of the [Node resolver] at the time of this writing. It is just a wrapper around substack/Browserify's synchronous [`resolve`]:

```js
var resolve = require('resolve/sync');
var isCoreModule = require('is-core-module');

exports.resolve = function (source, file, config) {
  if (isCoreModule(source)) return { found: true, path: null };
  try {
    return { found: true, path: resolve(source, opts(file, config)) };
  } catch (err) {
    return { found: false };
  }
};
```

[Node resolver]: ./node/index.js
[`resolve`]: https://www.npmjs.com/package/resolve
