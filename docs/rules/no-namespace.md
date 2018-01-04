# import/no-namespace

Reports if namespace import is used.

## Rule Details

Valid:

```js
import defaultExport from './foo'
import { a, b }  from './bar'
import defaultExport, { a, b }  from './foobar'
```

...whereas here imports will be reported:

```js
import * as foo from 'foo';
import defaultExport, * as foo from 'foo';
```

## When Not To Use It

If you want to use namespaces, you don't want to use this rule.
