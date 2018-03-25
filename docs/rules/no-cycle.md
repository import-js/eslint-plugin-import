# import/no-cycle

Ensures that there is no resolvable path back to this module via its dependencies.

By default, this rule only detects cycles for ES6 imports, but see the [`no-unresolved` options](./no-unresolved.md#options) as this rule also supports the same `commonjs` and `amd` flags. However, these flags only impact which import types are _linted_; the
import/export infrastructure only registers `import` statements in dependencies, so
cycles created by `require` within imported modules may not be detected.

This includes cycles of depth 1 (imported module imports me) to `Infinity`.

```js
// dep-b.js
import './dep-a.js'

export function b() { /* ... */ }

// dep-a.js
import { b } from './dep-b.js' // reported: Dependency cycle detected.
```

This rule does _not_ detect imports that resolve directly to the linted module;
for that, see [`no-self-import`].


## Rule Details

## When Not To Use It

This rule is computationally expensive. If you are pressed for lint time, or don't
think you have an issue with dependency cycles, you may not want this rule enabled.

## Further Reading

- [Original inspiring issue](https://github.com/benmosher/eslint-plugin-import/issues/941)
- Rule to detect that module imports itself: [`no-self-import`]

[`no-self-import`]: ./no-self-import.md
