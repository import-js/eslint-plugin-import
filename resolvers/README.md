# Resolver spec

Current version: v3 (2016-08-28)

Resolvers must export two names:

### `interfaceVersion => Number`

This document currently describes version 3 of the resolver interface. As such, a resolver implementing this version should

```js
export const interfaceVersion = 3
```
or
```js
exports.interfaceVersion = 3
```

To the extent it is feasible, trailing versions of the resolvers will continue to be supported, at least until a major version bump on the plugin proper.

Currently, version 1 is assumed if no `interfaceVersion` is available. (didn't think to define it until v2, heh. 😅)

### `resolve`

TypeScript signature:

```typescript
export function resolve(source: string, file: string, config: any): {
  // v2+ fields
  found: boolean,
  path?: string,
  // v3 fields
  importType?: "core" // string enum
}
```

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

an object provided via the `import/resolver` setting.`my-cool-resolver` will get `["some", "stuff"]` as its `config`, while
  `node` will get `{ "paths": ["a", "b", "c"] }` provided as `config`.

#### Return value

The first resolver to return `{found: true}` is considered the source of truth. The returned object has:

##### v2 fields
- `found`: `true` if the `source` module can be resolved relative to `file`, else `false`
- `path`: an absolute path `String` if the module can be located on the filesystem; else, `null`.

An example of a `null` path is a Node core module, such as `fs` or `crypto`.
These modules can always be resolved, but the path need not be provided as the
plugin will not attempt to parse core modules at this time.

##### v3 fields
- `importType`: a string identifying the flavor of import that best describes the
  module being imported. If provided, this string may be one of the following values:

  - `"core"`: a core platform module. Examples: Node's `path` module, Electron's `electron`, etc.


Other types may be added in the future.


If the resolver cannot resolve `source` relative to `file`, it should just return `{ found: false }`. No `path` key is needed in this case.

### getDependencies

Resolvers may also export a function with the following signature that exposes
dependencies for usage by the [`no-extraneous-dependencies`] rule.

The function must have the following signature (provided as TypeScript):

```typescript
type DependencyMap = { [packageName: string]: any }

export function getDependencies(sourceFile: string, config: any): null | {
  dependencies?: DependencyMap
  devDependencies?: DependencyMap
  optionalDependencies?: DependencyMap
  peerDependencies?: DependencyMap
}
```

This result object is derived from npm's `package.json` fields.

## Example resolver implementation

Here is most of the [Node resolver] at the time of this writing. It is just a wrapper around substack/Browserify's synchronous [`resolve`]:

```js
var resolve = require('resolve')

exports.resolve = function (source, file, config) {
  if (resolve.isCore(source)) return { found: true, path: null, importType: 'core' }
  try {
    return { found: true, path: resolve.sync(source, opts(file, config)) }
  } catch (err) {
    return { found: false }
  }
}
```

[Node resolver]: ./node/index.js
[`resolve`]: https://www.npmjs.com/package/resolve
[`no-extraneous-dependencies`]: ../docs/rules/no-extraneous-dependencies.md
