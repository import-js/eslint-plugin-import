# import/enforce-import-name

This rule will enforce a specific binding name for a default package import.
Works for ES6 imports and CJS require.


## Rule Details

Given:

There is a package `prop-types` with a default export

and

```json
// .eslintrc
{
  "rules": {
    "import/enforce-import-name": [
      "warn", {
        "prop-types": "PropTypes", // key: name of the module, value: desired binding for default import
      }
    ]
  }
}
```

The following is considered valid:

```js
import {default as PropTypes} from 'prop-types'

import PropTypes from 'prop-types'
```

```js
const PropTypes = require('prop-types');
```

...and the following cases are reported:

```js
import propTypes from 'prop-types';
import {default as propTypes} from 'prop-types';
```

```js
const propTypes = require('prop-types');
```

## When not to use it

As long as you don't want to enforce specific naming for default imports.

## Options

This rule accepts an object which is a mapping
between package name and the binding name that should be used for default imports.
For example, a configuration like the one below

`{'prop-types': 'PropTypes'}`

specifies that default import for the package `prop-types` should be aliased to `PropTypes`.
