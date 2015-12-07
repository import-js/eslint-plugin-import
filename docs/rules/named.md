# named

Verifies that all named imports are part of the set of named exports in the referenced module.

For `export`, verifies that all named exports exist in the referenced module.

Note: for modules, the plugin will find exported names from [`jsnext:main`], if present in `package.json`.
Redux's npm module includes this key, and thereby is lintable, for example. Otherwise,
the whole `node_modules` folder is ignored by default ([`import/ignore`]) as most published modules are
formatted in CommonJS, which [at time of this writing](https://github.com/benmosher/eslint-plugin-import/issues/13)
is not able to be analyzed for exports.


## Rule Details

Given:

```js
// ./foo.js
export const foo = "I'm so foo"
```

The following is considered valid:

```js
// ./bar.js
import { foo } from './foo'

// ES7 proposal
export { foo as bar } from './foo'

// node_modules without jsnext:main are not analyzed by default
// (import/ignore setting)
import { SomeNonsenseThatDoesntExist } from 'react'
```

...and the following are reported:

```js
// ./baz.js
import { notFoo } from './foo'

// ES7 proposal
export { notFoo as defNotBar } from './foo'

// will follow 'jsnext:main', if available
import { dontCreateStore } from 'redux'
```

### Settings

[`import/ignore`] can be provided as a setting to ignore certain modules (node_modules,
CoffeeScript, CSS if using Webpack, etc.).

Given:

```yaml
# .eslintrc (YAML)
---
settings:
  import/ignore:
    - node_modules  # included by default, but replaced if explicitly configured
    - *.coffee$     # can't parse CoffeeScript (unless a custom polyglot parser was configured)
```

and

```coffeescript
# ./whatever.coffee
exports.whatever = (foo) -> console.log foo
```

then the following is not reported:

```js
// ./foo.js

// can't be analyzed, and ignored, so not reported
import { notWhatever } from './whatever'
```

## When Not To Use It

If you are using CommonJS and/or modifying the exported namespace of any module at
runtime, you will likely see false positives with this rule.

## Further Reading

- [`import/ignore`] setting
- [`jsnext:main`] (Rollup)


[`jsnext:main`]: https://github.com/rollup/rollup/wiki/jsnext:main
[`import/ignore`]: ../../README.md#importignore
