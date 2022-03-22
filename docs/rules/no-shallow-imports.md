# import/no-shallow-imports

Prevent the use of shallow (barrel) imports.

## Examples

Given the following:

```sh
- /
    - dir1/
        - example1.js
        - index.js
    - dir2/
        - example2.js
        - index.js
    - tests/
        - index.test.js
    - index.js
```

Examples of **incorrect** code for this rule:

```sh
//  dir1/example1.js

import example2 from '..';                  // imports from /index.js
import example2 from '../dir2';             // imports from /dir2/index.js
import example2 from '../dir2/index';       // same as above but explicit
```

Examples of **correct** code for this rule:

```sh
//  dir1/example1.js

import example2 from '../dir2/example2';    // deep import :D
```

```sh
//  index.test.js

import * as index from '../index';          // allowed
```
