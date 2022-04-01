# import/no-shallow-imports

Prevent the use of shallow (barrel) imports.


## Options

There's one option available:
* `allow`:  an array of minimatch/glob patterns that match paths which allow shallow importing (exempt from the rule)

### Example rule (barebones)

```js
"import/no-shallow-imports": "error"
```

### Example rule (with option) 

```js
"import/no-shallow-imports": ["error", {
    "allow": ["**/index.test.*"]
}]
```

## Examples

Given the following structure, along with the example rule (with option) above....

```
my-project
├── dir1 
│   └── example1.js
│   └── index.js
└── dir2
│   └── example2.js
│   └── index.js
└── index.js
└── index.test.js
```


### Examples of **incorrect** code for this rule:

```js
//  dir1/example1.js

import example2 from '..';                  // imports from /index.js
import example2 from '../dir2';             // imports from /dir2/index.js
import example2 from '../dir2/index';       // same as above but explicit
```

### Examples of **correct** code for this rule:

```js
//  dir1/example1.js

import example2 from '../dir2/example2';    // deep import :D
```

```js
//  index.test.js

import * as index from './index';          // allowed
```
