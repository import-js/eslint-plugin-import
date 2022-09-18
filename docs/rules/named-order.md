# import/named-order

Enforce a convention in the order of `import` / `export` / `require()` specifiers
+(fixable) The `--fix` option on the [command line] automatically fixes problems reported by this rule.

## Rule Details

The following patterns are valid:

```js
import { Alpha, Bravo } from 'foo'
```

```js
const { Alpha, Bravo } = require('foo')
```

```js
const Alpha = 'A'
const Bravo = 'B'

export { Alpha, Bravo }
```

The following patterns are invalid:

```js
import { Bravo, Alpha } from 'foo' // <- reported
```

```js
const { Bravo, Alpha } = require('foo') // <- reported
```

```js
const Alpha = 'A'
const Bravo = 'B'

export { Alpha, Bravo } // <- reported
```

### Options

#### `esmodule`
This option enables reporting of errors if `import` / `export` specifiers are not sorted. Its value is `true` by default.

#### `commonjs`
This option enablee reporting of errors if `require` specifiers are not sorted. Its value is `true` by default.

#### `caseInsensitive`
There is a `caseInsensitive` option available to be case insensitive. Its value is `false` by default.

Without `caseInsensitive` option:
```js
import { alpha, Alpha, ALPHA } from 'foo' // <- reported, should sort as { ALPHA, Alpha, alpha }
```

With `caseInsensitive` option:
```js
import { alpha, Alpha, ALPHA } from 'foo' // <- will not report
```

#### `order`
There is a `order` option available to sort an order into either `asc` or `desc`. Its value is `asc` by default.

## When Not To Use It

If your environment specifically requires specifiers order of `import` / `export` / `require`.
