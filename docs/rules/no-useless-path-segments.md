# import/no-useless-path-segments

Use this rule to prevent unnecessary path segments in import and require statements.

## Rule Details

Given the following folder structure:

```
my-project
├── app.js
├── footer.js
├── header.js
└── pages
    ├── about.js
    ├── contact.js
    └── index.js
```

The following patterns are considered problems:

```js
/**
 *  in my-project/app.js
 */

import "./../pages/about.js"; // should be "./pages/about.js"
import "./../pages/about"; // should be "./pages/about"
import "../pages/about.js"; // should be "./pages/about.js"
import "../pages/about"; // should be "./pages/about"
import "./pages//about"; // should be "./pages/about"
import "./pages/"; // should be "./pages"
```

The following patterns are NOT considered problems:

```js
/**
 *  in my-project/app.js
 */

import "./header.js";
import "./pages";
import "./pages/about";
import ".";
import "..";
import fs from "fs";
```
