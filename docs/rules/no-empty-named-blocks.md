# import/no-empty-named-blocks

Reports the use of empty named import blocks.

## Rule Details

### Valid
```js
import { mod } from 'mod'
import Default, { mod } from 'mod'
```

When using typescript
```js
import type { mod } from 'mod'
```

When using flow
```js
import typeof { mod } from 'mod'
```

### Invalid
```js
import {} from 'mod'
import Default, {} from 'mod'
```

When using typescript
```js
import type Default, {} from 'mod'
import type {} from 'mod'
```

When using flow
```js
import typeof {} from 'mod'
import typeof Default, {} from 'mod'
```