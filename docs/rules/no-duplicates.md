# no-duplicates

Reports if a resolved path is imported more than once.

## Rule Details

Valid:
```js
import SomeDefaultClass, * as names from './mod'
```

...whereas here, both `./mod` imports will be reported:

```js
import SomeDefaultClass from './mod'

// oops, some other import separated these lines
import foo from './some-other-mod'

import * as names from './mod'
```

The motivation is that this is likely a result of two developers importing different
names from the same module at different times (and potentially largely different
locations in the file.) This rule brings both (or n-many) to attention.

## When Not To Use It

If you like to split up imports across lines or may need to import a default and a namespace,
you may want to disable this rule.
