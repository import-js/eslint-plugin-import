# import/newline-after-import

Enforces having one or more empty lines after the last top-level import statement or require call.
+(fixable) The `--fix` option on the [command line] automatically fixes problems reported by this rule.

## Rule Details

This rule supports the following options: 
- `count` which sets the number of newlines that are enforced after the last top-level import statement or require call. This option defaults to `1`.

- `considerComments` which enforces the rule on comments after the last import-statement as well when set to true. This option defaults to `false`.

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

Invalid:

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

With `count` set to `2` this will be considered valid:

```js
import defaultExport from './foo'


const FOO = 'BAR'
```

With `count` set to `2` these will be considered invalid:

```js
import defaultExport from './foo'
const FOO = 'BAR'
```

```js
import defaultExport from './foo'

const FOO = 'BAR'
```

With `considerComments` set to `false` this will be considered valid:

```js
import defaultExport from './foo'
// some comment here.
const FOO = 'BAR'
```

With `considerComments` set to `true` this will be considered valid:

```js
import defaultExport from './foo'

// some comment here.
const FOO = 'BAR'
```

With `considerComments` set to `true` this will be considered invalid:

```js
import defaultExport from './foo'
// some comment here.
const FOO = 'BAR'
```

## Example options usage
```json
{
  "rules": {
    "import/newline-after-import": ["error", { "count": 2 }]
  }
}
```


## When Not To Use It

If you like to visually group module imports with its usage, you don't want to use this rule.
