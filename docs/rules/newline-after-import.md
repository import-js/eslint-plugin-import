# newline-after-import

Reports if there's no new line after last import/require in group.

## Rule Details

**NOTE**: In each of those examples you can replace `import` call with `require`.

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

## When Not To Use It

If you like to visually group module imports with its usage, you don't want to use this rule.
