# no-duplicates

Reports if a resolved path is imported more than once.

ESLint core has a similar rule ([`no-duplicate-imports`](http://eslint.org/docs/rules/no-duplicate-imports)), but this version
is different in two key ways:

1. the paths in the source code don't have to exactly match, they just have to point to the same module on the filesystem. (i.e. `./foo` and `./foo.js`)
2. this version distinguishes Flow `type` imports from standard imports. ([#334](https://github.com/benmosher/eslint-plugin-import/pull/334))

## Rule Details

Valid:
```js
import SomeDefaultClass, * as names from './mod'
// Flow `type` import from same module is fine
import type SomeType from './mod'
```

...whereas here, both `./mod` imports will be reported:

```js
import SomeDefaultClass from './mod'

// oops, some other import separated these lines
import foo from './some-other-mod'

import * as names from './mod'

// will catch this too, assuming it is the same target module
import { something } from './mod.js'
```

The motivation is that this is likely a result of two developers importing different
names from the same module at different times (and potentially largely different
locations in the file.) This rule brings both (or n-many) to attention.

## When Not To Use It

If the core ESLint version is good enough (i.e. you're _not_ using Flow and you _are_ using [`import/extensions`](./extensions.md)), keep it and don't use this.

If you like to split up imports across lines or may need to import a default and a namespace,
you may not want to enable this rule.
