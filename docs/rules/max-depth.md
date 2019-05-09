# import/max-dependencies

Forbid importing into nested folders of a module.

This is a useful rule as import from packages you should stick to the public API (which is typically exported from the root of the package). Depending on specific folders in a package that are not public API exposes you to a greater potential of breaking changes.

### Options

This rule takes the following options:

#### `max`
`max`: The maximum number of nested directories allowed. Anything over will trigger the rule. **Default is 0** if the rule is enabled and no `max` is specified.

You can set the option like this:

```js
"import/max-depth": ["error", {"max": 2}]
```

#### `overridePackages`
`overridePackages`: This allows you to override this rule for specific packages. This can be useful if the packages public API is expected to be imported from nested directories such as `lodash`. This options is declared as an object with the key being set to the name of the package and the value is set to the `max` for that package only.

You can set the option like this:

```js
"import/max-depth": ["error", {"overridePackages": {'lodash': 2}}]
```

## Example

Given a max value of `{"max": 0}`:

### Fail

```js
import map from "lodash/map"
const map = require("lodash/map")
```

### Pass

```js
import "lodash"
import _ from "lodash"
const _ = require("lodash")
```

## When Not To Use It

If you don't care how about imports deeply nested into packages.
