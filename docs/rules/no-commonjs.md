# no-commonjs

Reports `require([string])` function calls. Will not report if >1 argument,
or single argument is not a literal string.

Reports `module.exports` or `exports.*`, also.

Intended for temporary use when migrating to pure ES6 modules.

## Rule Details

This will be reported:

```js
var mod = require('./mod')
  , common = require('./common')
  , fs = require('fs')
  , whateverModule = require('./not-found')

module.exports = { a: "b" }
exports.c = "d"
```

## When Not To Use It

If you don't mind mixing module systems (sometimes this is useful), you probably
don't want this rule.

It is also fairly noisy if you have a larger codebase that is being transitioned
from CommonJS to ES6 modules.


## Contributors

Special thanks to @xjamundx for donating the module.exports and exports.* bits.

## Further Reading

- [`no-amd`](./no-amd.md): report on AMD `require`, `define`
- Source: https://github.com/xjamundx/eslint-plugin-modules
