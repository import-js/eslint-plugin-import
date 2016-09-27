# Forbid unassigned imports

With both CommonJS' `require` and the ES6 modules' `import` syntax, it is possible to import a module but not to use its result. This can be done explicitly by not assigning the module to as variable. Doing so can mean either of the following things:
- The module is imported but not used
- The module has side-effects (like [`should`](https://www.npmjs.com/package/should)). Having side-effects, makes it hard to know whether the module is actually used or can be removed. It can also make it harder to test or mock parts of your application.

This rule aims to remove modules with side-effects by reporting when a module is imported but not assigned.

## Fail

```js
import 'should'
require('should')
```


## Pass

```js
import _ from 'foo'
import _, {foo} from 'foo'
import _, {foo as bar} from 'foo'
import {foo as bar} from 'foo'
import * as _ from 'foo'

const _ = require('foo')
const {foo} = require('foo')
const {foo: bar} = require('foo')
const [a, b] = require('foo')
const _ = require('foo')

// Module is not assigned, but it is used
bar(require('foo'))
require('foo').bar
require('foo').bar()
require('foo')()
```
