# import/match-default-export-name

Reports use of import name what doesn't match the default export name. Does nothing for anonymous default exports.

## Rule Details

Given:
```js
// foo.js
export default function myFunction() {}
```

...this would be valid:
```js
import myFunction from './foo.js';
```

...and this would be reported:
```js
// message: Expected import 'myFn' to match the default export 'myFunction'.
import myFn from './foo.js';
```

Also works for post-ES2015 `export` extensions:

valid:
```js
export myFunction from './foo.js';
```

reported:
```js
// message: Expected export 'myFn' to match the default export 'myFunction'.
export myFn from './foo.js';
```

## Options

This rule supports the following options:

### `overrides: [array of objects]`:

This defines custom default import names for specific modules.

Properties of the objects

| property | required | type   | description   |
|----------|:--------:|--------|---------------|
| module   |     x    | string | module name to match |
| name     |     x    | string | default import name pattern |

```json
{
  "import/match-default-export-name": ["error", {
    "overrides": [
      {
        "module": "react",
        "name": "React"
      },
      {
        "module": "/styles\\.css$/",
        "name": "styles"
      },
      {
        "module": "/(\\w+)\\.module\\.css$/",
        "name": "$1Styles"
      }
    ]
  }]
}
```
