# import/no-namespace

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

Enforce a convention of not using namespace (a.k.a. "wildcard" `*`) imports.

The rule is auto-fixable when the namespace object is only used for direct member access, e.g. `namespace.a`.

## Options

<!-- begin auto-generated rule options list -->

| Name     | Description                                                  | Type     |
| :------- | :----------------------------------------------------------- | :------- |
| `ignore` | Glob strings for modules that should be ignored by the rule. | String[] |

<!-- end auto-generated rule options list -->

## Rule Details

Valid:

```js
import defaultExport from './foo'
import { a, b }  from './bar'
import defaultExport, { a, b }  from './foobar'
```

```js
/* eslint import/no-namespace: ["error", {ignore: ['*.ext']}] */
import * as bar from './ignored-module.ext';
```

Invalid:

```js
import * as foo from 'foo';
```

```js
import defaultExport, * as foo from 'foo';
```

## When Not To Use It

If you want to use namespaces, you don't want to use this rule.
