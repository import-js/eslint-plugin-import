# no-reaching-inside

Use this rule to prevent importing the submodules of other modules.

## Rule Details

This rule has one option, `allow` which is an array of minimatch patterns to identify directories whose children can be imported explicitly.

### Examples

Given the following folder structure:

```
my-project
├── actions
│   └── getUser.js
│   └── updateUser.js
├── reducer
│   └── index.js
│   └── user.js
├── redux
│   └── index.js
│   └── configureStore.js
└── app
│   └── index.js
│   └── settings.js
└── entry.js
```

And the .eslintrc file:
```
{
  ...
  "rules": {
    "import/no-reaching-inside": [ "error", {
      "allow": [ "**/actions", "source-map-support/*" ]
    } ]
  }
}
```

The following patterns are considered problems:

```js
/**
 *  in my-project/entry.jz
 */

import { settings } from './app/index'; // Reaching into "./app" is not allowed
import userReducer from './reducer/user'; // Reaching into "./reducer" is not allowed
import configureStore from './redux/configureStore'; // Reaching into "./redux" is not allowed
```

The following patterns are NOT considered problems:

```js
/**
 *  in my-project/entry.jz
 */

import 'source-map-support/register';
import { settings } from '../app';
import getUser from '../actions/getUser';
```
