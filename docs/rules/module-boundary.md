# module-boundary

Forbid deep imports when directory has an index file.

Limiting deep imports allows modules to define boundary that's private to module and allow breaking
code down into multiple files without exposing internal details.

## Rule Details

Given following folder structure:

```text
root
|- module-a/
|  |- sub-module-a/
|  |  |- file.js
|  |  |- index.js
|  |- file.js
|  |- index.js
|- module-b/
|  |- sub-module-b/
|  |  |- file.js
|- module-c/
|  |- file.js
|- module-c.js
|- file.js
|- index.js
```

### Fail

```js
// from root/index.js
import "./module-a/file.js";
import "./module-a/sub-module-a/index.js";

// from root/module-b/file.js
import "../module-a/file.js";
```

### Pass
```js
// from root/index.js
import "./module-a";
import "./module-a/index";
import "./module-a/index.js";
import "./module-b/file.js";
import "./module-c";
import "./module-c/file.js";

// from root/module-b/file.js
import "../a-module";
import "../file.js";
```
