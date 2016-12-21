# newline-after-import

Enforces having an empty line after the last top-level import statement or require call.
+(fixable) The `--fix` option on the [command line] automatically fixes problems reported by this rule.

## Rule Details

Valid:

```js
import defaultExport from './foo'

const FOO = 'BAR'
```

```js
import defaultExport from './foo'
import { bar }  from 'bar-lib'

const FOO = 'BAR'
```

```js
const FOO = require('./foo')
const BAR = require('./bar')

const BAZ = 1
```

...whereas here imports will be reported:

```js
import * as foo from 'foo'
const FOO = 'BAR'
```

```js
import * as foo from 'foo'
const FOO = 'BAR'

import { bar }  from 'bar-lib'
```

```js
const FOO = require('./foo')
const BAZ = 1
const BAR = require('./bar')
```

## When Not To Use It

If you like to visually group module imports with its usage, you don't want to use this rule.
