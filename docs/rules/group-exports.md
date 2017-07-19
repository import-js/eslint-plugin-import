# group-exports

Reports when named exports are not grouped together in a single `export` declaration or when multiple assignments to CommonJS `module.exports` or `exports` object are present in a single file.

**Rationale:** An `export` declaration or `module.exports` assignment can appear anywhere in the code. By requiring a single export declaration all your exports will remain at one place, making it easier to see what exports a module provides.

## Rule Details

This rule warns whenever a single file contains multiple named export declarations or multiple assignments to `module.exports` (or `exports`).

### Valid

```js
// A single named export declaration -> ok
export const valid = true
```

```js
const first = true
const second = true

// A single named export declaration -> ok
export {
  first,
  second,
}
```

```js
// A single exports assignment -> ok
module.exports = {
  first: true,
  second: true
}
```

```js
const first = true
const second = true

// A single exports assignment -> ok
module.exports = {
  first,
  second,
}
```

```js
function test() {}
test.property = true
test.another = true

// A single exports assignment -> ok
module.exports = test
```


### Invalid

```js
// Multiple named export statements -> not ok!
export const first = true
export const second = true
```

```js
// Multiple exports assignments -> not ok!
exports.first = true
exports.second = true
```

```js
// Multiple exports assignments -> not ok!
module.exports = {}
module.exports.first = true
```

```js
// Multiple exports assignments -> not ok!
module.exports = () => {}
module.exports.first = true
module.exports.second = true
```

## When Not To Use It

If you do not mind having your exports spread across the file, you can safely turn this rule off.
