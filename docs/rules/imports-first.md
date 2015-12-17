# imports-first

By popular demand, this rule reports any imports that come after non-import
statments.

## Rule Details

```js
import foo from './foo'

// some module-level initializer
initWith(foo)

import bar from './bar' // <- reported
```

Providing `absolute-first` as an option will report any absolute imports (i.e.
packages) that come after any relative imports:

```js
import foo from 'foo'
import bar from './bar'

import * as _ from 'lodash' // <- reported
```

TODO: add explanation of imported name hoisting

## When Not To Use It

If you don't mind imports being sprinkled throughout, you may not want to
enable this rule.
