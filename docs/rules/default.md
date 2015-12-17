# default

If a default import is requested, this rule will report if there is no default
export in the imported module.

For [ES7], reports if a default is named and exported but is not found in the
referenced module.

Note: for modules, the plugin will find exported names (including defaults)
from [`jsnext:main`], if present in `package.json`.
Redux's npm module includes this key, and thereby is lintable, for example. Otherwise,
the whole `node_modules` folder is ignored by default ([`import/ignore`]) as most published modules are
formatted in CommonJS, which [at time of this writing](https://github.com/benmosher/eslint-plugin-import/issues/13)
is not able to be analyzed for exports.


## Rule Details

Given:

```js
// ./foo.js
export default function () { return 42 }

// ./bar.js
export function bar() { return null }

// ./baz.js
module.exports = function () { /* ... */ }

// node_modules/some-module/index.js
exports.sharedFunction = function shared() { /* ... */ }
```

The following is considered valid:

```js
import foo from './foo'

// assuming 'node_modules' are ignored (true by default)
import someModule from 'some-module'
```

...and the following cases are reported:

```js
import bar from './bar' // no default export found in ./bar
import baz from './baz' // no default export found in ./baz
```


## When Not To Use It

If you are using CommonJS and/or modifying the exported namespace of any module at
runtime, you will likely see false positives with this rule.

This rule currently does not interpret `module.exports = ...` as a `default` export,
either, so such a situation will be reported in the importing module.

## Further Reading

- Lee Byron's [ES7] export proposal
- [`import/ignore`] setting
- [`jsnext:main`] (Rollup)


[ES7]: https://github.com/leebyron/ecmascript-more-export-from
[`import/ignore`]: ../../README.md#importignore
[`jsnext:main`]: https://github.com/rollup/rollup/wiki/jsnext:main
