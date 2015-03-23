eslint-plugin-import
---
[![build status](https://travis-ci.org/benmosher/eslint-plugin-import.svg)](https://travis-ci.org/benmosher/eslint-plugin-import)
[![npm](https://img.shields.io/npm/v/eslint-plugin-import.svg)](https://www.npmjs.com/package/eslint-plugin-import)

This plugin intends to support linting of ES6 import syntax, and prevent issues with misspelling of file paths and import names. All the goodness that the ES6 static module syntax intends to provide, marked up in your editor.

**Current support**:

* Ensure imports point to a file/module that exists. ([`exists`](#exists))
* Ensure named imports correspond to a named export in the remote file. ([`named`](#named))
* Ensure a default export is present, given a default import. ([`default`](#default))

**Planned**:

* Validate that namespace (`*`) imports exist as named exports in remote file, when dereferenced.

## Rules

### `exists`

Ensures an imported module exists, as defined by standard Node `require.resolve` behavior.

### `named`

Verifies that all named imports are part of the set of named exports in the referenced module.

Note that if there are _no_ named exports, nor a default export, this rule will not report a mismatch, to allow Babel-style `import` of CommonJS modules.

Provide the `es6-only` option in your rule config if you would like to enforce this on all imports.

### `default`

If a default import is requested, this rule will report if there is no default export in the imported module.

Note that if there are _no_ named exports, nor a default export, this rule will not report a mismatch, to allow Babel-style `import` of CommonJS modules.

Provide the `es6-only` option in your rule config if you would like to enforce this on all imports.

### `no-common`

Report for imports that are defined as CommonJS modules, identified by the presence of `module.exports` or `exports[...]` assignments at the root scope of the module. Off by default.
