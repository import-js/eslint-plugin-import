This rules helps to define type import patterns for the typescript.

## Rule details

##### rule schema:

```javascript
"import/prefer-default-export": [
    ( "off" | "warn" | "error" ),
	{ "prefer": "none" | "separate" | "modifier" } // default is ???
]
```
### Config Options

There are three avaiable options: `none`, `separate`, `modifier`.

```javascript
// import-stars.js

// The remote module is not inspected.
import * from './other-module'
import * as b from './other-module'

```