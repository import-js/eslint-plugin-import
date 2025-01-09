# import/no-rename-default

<!-- end auto-generated rule header -->

Prohibit importing a default export by another name.

## Rule Details

Given:

```js
// api/get-users.js
export default async function getUsers() {}
```

...this would be valid:

```js
import getUsers from './api/get-users.js';
```

...and the following would be reported:

```js
// Caution: `get-users.js` has a default export `getUsers`.
// This imports `getUsers` as `findUsers`.
// Check if you meant to write `import getUsers from './api/get-users'` instead.
import findUsers from './get-users';
```
