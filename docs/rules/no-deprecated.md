# no-deprecated

**Stage: 0**

**NOTE**: this rule is currently a work in progress. There may be "breaking" changes: most likely, additional cases that are flagged.

Reports use of a deprecated name, as indicated by a JSDoc block with a `@deprecated`
tag, i.e.

```js
// @file: ./answer.js

/**
 * this is what you get when you trust a mouse talk show
 * @deprecated need to restart the experiment
 * @returns {Number} nonsense
 */
export function multiply(six, nine) {
  return 42
}
```

will report as such:

```js
import { multiply } from './answer' // Deprecated: need to restart the experiment

function whatever(y, z) {
  return multiply(y, z) // Deprecated: need to restart the experiment
}
```

### Worklist

- [x] report explicit imports on the import node
- [ ] support namespaces
  - [ ] should bubble up through deep namespaces (#157)
- [x] report explicit imports at reference time (at the identifier) similar to namespace
- [ ] mark module deprecated if file JSDoc has a @deprecated tag?

