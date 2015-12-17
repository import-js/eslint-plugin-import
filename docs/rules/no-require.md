# no-require

Reports `require([string])` function calls. Will not report if >1 argument,
or single argument is not a literal string.

Intended for temporary use when migrating to pure ES6 modules.

## Rule Details

Given:
```js
// ./mod.js
export const foo = 'bar'
export function bar() { return foo }

// ./common.js
exports.something = 'whatever'
```

This would be reported:

```js
var mod = require('./mod')
  , common = require('./common')
  , fs = require('fs')
  , whateverModule = require('./not-found')
```

## When Not To Use It

If you don't mind mixing module systems (sometimes this is useful), you probably
don't want this rule.

It is also fairly noisy if you have a larger codebase that is being transitioned
from CommonJS to ES6 modules.
