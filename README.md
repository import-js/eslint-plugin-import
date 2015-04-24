eslint-plugin-import
---
[![build status](https://travis-ci.org/benmosher/eslint-plugin-import.svg)](https://travis-ci.org/benmosher/eslint-plugin-import)
[![npm](https://img.shields.io/npm/v/eslint-plugin-import.svg)](https://www.npmjs.com/package/eslint-plugin-import)

This plugin intends to support linting of ES6 import syntax, and prevent issues with misspelling of file paths and import names. All the goodness that the ES6 static module syntax intends to provide, marked up in your editor.

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

Will attempt to resolve from one or more paths from the `resolve.root` shared setting, i.e.

```
---
settings:
  resolve.root: 'src'
```
or
```
  resolve.root:
    - 'src'
    - 'lib'
```

Paths may be absolute or relative to the package root (i.e., where your `package.json` is).


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


## Debugging

### `no-errors`

Reports on errors in the attempt to parse the imported module for exports.
Primarily useful for determining why imports are not being reported properly by the other rules.
Pass `include-messages` as an option to include error descriptions in the report.

## [`eslint-import-core`](https://github.com/benmosher/eslint-import-core)

The guts of resolving and traversing external imports for markers (so far,
exported names/defaults) have been extracted to a separate module,
`eslint-import-core`.

With your input and feedback, it could become a useful building block for more
library-specific cases, i.e. checking whether an imported parent class is a
descendent of some meaningful root class (`React.Component` comes to mind).

So far, it's just a merged reduction of the history of this project, but I hope
to see it grow to become more than just that.
