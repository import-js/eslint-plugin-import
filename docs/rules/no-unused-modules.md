# import/no-unused-modules

<!-- end auto-generated rule header -->

Reports:

 - modules without any exports
 - individual exports not being statically `import`ed or `require`ed from other modules in the same project
 - dynamic imports are supported if argument is a literal string

## Rule Details

### Usage

In order for this plugin to work, at least one of the options `missingExports` or `unusedExports` must be enabled (see "Options" section below). In the future, these options will be enabled by default (see <https://github.com/import-js/eslint-plugin-import/issues/1324>)

Example:

```json
"rules: {
  ...otherRules,
  "import/no-unused-modules": [1, {"unusedExports": true}]
}
```

### Options

<!-- begin auto-generated rule options list -->

| Name             | Description                                                                                                | Type     | Choices | Default         | Required |
| :--------------- | :--------------------------------------------------------------------------------------------------------- | :------- | :------ | :-------------- | :------- |
| `ignoreExports`  | files/paths for which unused exports will not be reported (e.g module entry points in a published package) | String[] |         |                 |          |
| `missingExports` | report modules without any exports                                                                         | Boolean  |         | `false`         |          |
| `missingExports` |                                                                                                            |          | `true`  |                 | Yes      |
| `src`            | files/paths to be analyzed (only for unused exports)                                                       | String[] |         | `process.cwd()` |          |
| `src`            |                                                                                                            |          |         |                 |          |
| `unusedExports`  | report exports without any usage                                                                           | Boolean  |         | `false`         |          |
| `unusedExports`  |                                                                                                            |          | `true`  |                 | Yes      |

<!-- end auto-generated rule options list -->

### Example for missing exports

#### The following will be reported

```js
const class MyClass { /*...*/ }

function makeClass() { return new MyClass(...arguments) }
```

#### The following will not be reported

```js
export default function () { /*...*/ }
```

```js
export const foo = function () { /*...*/ }
```

```js
export { foo, bar }
```

```js
export { foo as bar }
```

### Example for unused exports

given file-f:

```js
import { e } from 'file-a'
import { f } from 'file-b'
import * as fileC from  'file-c'
export { default, i0 } from 'file-d' // both will be reported

export const j = 99 // will be reported
```

and file-d:

```js
export const i0 = 9 // will not be reported
export const i1 = 9 // will be reported
export default () => {} // will not be reported
```

and file-c:

```js
export const h = 8 // will not be reported
export default () => {} // will be reported, as export * only considers named exports and ignores default exports
```

and file-b:

```js
import two, { b, c, doAnything } from 'file-a'

export const f = 6 // will not be reported
```

and file-a:

```js
const b = 2
const c = 3
const d = 4

export const a = 1 // will be reported

export { b, c } // will not be reported

export { d as e } // will not be reported

export function doAnything() {
  // some code
}  // will not be reported

export default 5 // will not be reported
```

#### Important Note

Exports from files listed as a main file (`main`, `browser`, or `bin` fields in `package.json`) will be ignored by default. This only applies if the `package.json` is not set to `private: true`

## When not to use

If you don't mind having unused files or dead code within your codebase, you can disable this rule
