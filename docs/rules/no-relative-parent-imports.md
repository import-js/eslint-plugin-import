# no-relative-parent-imports

Use this rule to prevent imports to folds in relative parent paths.

It's useful for large codebases codebases to enforce directed-acyclic-graph like folder structures.


### Examples

Given the following folder structure:

```
my-project
├── lib
│   ├── a.js
│   └── b.js
└── main.js
```

And the .eslintrc file:
```
{
  ...
  "rules": {
    "import/no-relative-parent-imports": "error"
  }
}
```

The following patterns are considered problems:

```js
/**
 *  in my-project/lib/a.js
 */

import bar from '../main'; // Import parent file using a relative path
```

The following patterns are NOT considered problems:

```js
/**
 *  in my-project/main.js
 */

import foo from 'foo'; // Import package using module path
import a from './lib/a'; // Import child file using relative path

/**
 *  in my-project/lib/a.js
 */

import b from './b'; // Import sibling file using relative path
```
