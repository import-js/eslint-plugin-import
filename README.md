eslint-plugin-import
---

This plugin intends to support linting of ES6 import syntax, and prevent issues with misspelling of file paths and import names. All the goodness that the ES6 static module syntax intends to provide, marked up in your editor.

Current support:

* Ensures relative imports point to a file that exists. (rule: `valid-relative-path`)

Planned:

* Validate that named imports match named exports.
* Validate that `*` imports exist as named exports in remote file, where dereferenced.
* Validate that a default export exists, when imported.
