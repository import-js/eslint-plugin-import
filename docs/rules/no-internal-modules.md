# import/no-internal-modules

<!-- end auto-generated rule header -->

Use this rule to prevent importing the submodules of other modules.

## Rule Details

This rule has two mutally exclusive options that are arrays of [minimatch/glob patterns](https://github.com/isaacs/node-glob#glob-primer) patterns:

<!-- begin auto-generated rule options list -->

| Name     | Description                                                             | Type     |
| :------- | :---------------------------------------------------------------------- | :------- |
| `allow`  | Include paths and import statements that can be imported with reaching. | String[] |
| `forbid` | Exclude paths and import statements that can be imported with reaching. | String[] |

<!-- end auto-generated rule options list -->

### Examples

Given the following folder structure:

```pt
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

```json
{
  ...
  "rules": {
    "import/no-internal-modules": [ "error", {
      "allow": [ "**/actions/*", "source-map-support/*" ],
    } ]
  }
}
```

The following patterns are considered problems:

```js
/**
 *  in my-project/entry.js
 */

import { settings } from './app/index'; // Reaching to "./app/index" is not allowed
import userReducer from './reducer/user'; // Reaching to "./reducer/user" is not allowed
import configureStore from './redux/configureStore'; // Reaching to "./redux/configureStore" is not allowed

export { settings } from './app/index'; // Reaching to "./app/index" is not allowed
export * from './reducer/user'; // Reaching to "./reducer/user" is not allowed
```

The following patterns are NOT considered problems:

```js
/**
 *  in my-project/entry.js
 */

import 'source-map-support/register';
import { settings } from '../app';
import getUser from '../actions/getUser';

export * from 'source-map-support/register';
export { settings } from '../app';
```

Given the following folder structure:

```pt
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

```json
{
  ...
  "rules": {
    "import/no-internal-modules": [ "error", {
      "forbid": [ "**/actions/*", "source-map-support/*" ],
    } ]
  }
}
```

The following patterns are considered problems:

```js
/**
 *  in my-project/entry.js
 */

import 'source-map-support/register';
import getUser from '../actions/getUser';

export * from 'source-map-support/register';
export getUser from '../actions/getUser';
```

The following patterns are NOT considered problems:

```js
/**
 *  in my-project/entry.js
 */

import 'source-map-support';
import { getUser } from '../actions';

export * from 'source-map-support';
export { getUser } from '../actions';
```
