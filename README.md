eslint-plugin-import
---
[![build status](https://travis-ci.org/benmosher/eslint-plugin-import.svg)](https://travis-ci.org/benmosher/eslint-plugin-import)
[![npm](https://img.shields.io/npm/v/eslint-plugin-import.svg)](https://www.npmjs.com/package/eslint-plugin-import)

This plugin intends to support linting of ES6 import syntax, and prevent issues with misspelling of file paths and import names. All the goodness that the ES6 static module syntax intends to provide, marked up in your editor.

**IF YOU ARE USING THIS WITH SUBLIME**: see the [bottom section](#sublimelinter-eslint) for important info.

**Current support**:

* Ensure imports point to a file/module that can be resolved. ([`no-unresolved`](#no-unresolved))
* Ensure named imports correspond to a named export in the remote file. ([`named`](#named))
* Ensure a default export is present, given a default import. ([`default`](#default))
* Ensure imported namespaces contain dereferenced properties as they are dereferenced. ([`namespace`](#namespace))
* Report assignments (at any scope) to imported names/namespaces. ([`no-reassign`](#no-reassign))
* Report CommonJS `require` of ES6 module. ([`no-require`](#no-require), off by default)
* Report use of exported name as identifier of default export ([`no-named-as-default`](#no-named-as-default))

## Installation

```sh
npm install eslint-plugin-import -g
```

or if you manage ESLint as a dev dependency:

```sh
# inside your project's working tree
npm install eslint-plugin-import --save-dev
```

## Rules

### `no-unresolved`

Ensures an imported module can be resolved to a module on the local filesystem,
as defined by standard Node `require.resolve` behavior.

See [settings](#settings) for customization options for the resolution (i.e.
additional filetypes, `NODE_PATH`, etc.)


### `named`

Verifies that all named imports are part of the set of named exports in the referenced module.

### `default`

If a default import is requested, this rule will report if there is no default
export in the imported module.

### `namespace`

Enforces names exist at the time they are dereferenced, when imported as a full namespace (i.e. `import * as foo from './foo'; foo.bar();` will report if `bar` is not exported by `./foo`.).

Will report at the import declaration if there are _no_ exported names found.

Also, will report for computed references (i.e. `foo["bar"]()`).

**Implementation note**: currently, this rule does not check for possible redefinition of the namespace in an intermediate scope. Adherence to either `import/no-reassign` or the ESLint `no-shadow` rule for namespaces will prevent this from being a problem.

### `no-reassign`

Reports on assignment to an imported name (or a member of an imported namespace).
Will also report shadowing (i.e. redeclaration as a variable, function, or parameter);

### `no-require`

Reports `require` of modules with ES named or default exports. Off by default.

### `no-named-as-default`

Reports use of an exported name as the locally imported name of a default export.

Given:
```js
// foo.js
export default 'foo';
export const bar = 'baz';
```

...this would be valid:
```js
import foo from './foo.js';
```

...and this would be reported:
```js
// message: Using exported name 'bar' as identifier for default export.
import bar from './foo.js';
```

Rationale: using an exported name as the name of the default export is likely

- misleading: others familiar with `foo.js` probably expect the name to be `foo`
- a mistake: only needed to import `bar` and forgot the brackets (the case that is prompting this)

## Settings

You may set the following settings in your `.eslintrc`:

#### `import/ignore`

A list of regex strings that, if matched by a path, will
  not parse the matching module. In practice, this means rules other than
  `no-unresolved` will not report on the `import` in question.
#### `import/resolve`

A passthrough to [resolve]'s `opts` parameter for `resolve.sync`.

[resolve]: https://www.npmjs.com/package/resolve#resolve-sync-id-opts

Here is an example `.eslintrc` for reference:

```yaml
plugins:
  - import

rules:
  import/default: 2
  import/no-unresolved: 1

settings:
  import/ignore:
    # any imported module path matching one of these patterns will not be parsed
    - 'node_modules' # this is the default, but must be included if overwritten
    - '\\.es5$'

  import/resolve:

    extensions:
      # if unset, default is just '.js', but it must be re-added explicitly if set
      - .js
      - .jsx
      - .es6
      - .coffee

    paths:
      # an array of absolute paths which will also be searched
      # think NODE_PATH
      - /usr/local/share/global_modules

    # this is technically for identifying `node_modules` alternate names
    moduleDirectory:

      - node_modules # defaults to 'node_modules', but...
      - bower_components

      - project/src  # can add a path segment here that will act like
                     # a source root, for in-project aliasing (i.e.
                     # `import MyStore from 'stores/my-store'`)
```

## Debugging

### `no-errors`

Reports on errors in the attempt to parse the imported module for exports.
Primarily useful for determining why imports are not being reported properly by the other rules.
Pass `include-messages` as an option to include error descriptions in the report.

## SublimeLinter-eslint

Recently, SublimeLinter-eslint introduced a change to support `.eslintignore` files
which altered the way file paths are passed to ESLint when linting during editing.

See roadhump/SublimeLinter-eslint#58 for more details, but essentially, you may find
you need to add the following to a `.sublimelinterrc` file:

```json
{
  "linters": {
    "eslint": {
      "args": ["--stdin-filename", "@"]
    }
  }
}
```

I also found that I needed to set `rc_search_limit` to `null`, which removes the file
hierarchy search limit when looking up the directory tree for `.sublimelinterrc`:

In Package Settings / SublimeLinter / User Settings:
```json
{
  "user": {
    "rc_search_limit": null
  }
}
```

I believe this defaults to `3`, so you may not need to alter it depending on your
project folder max depth.
