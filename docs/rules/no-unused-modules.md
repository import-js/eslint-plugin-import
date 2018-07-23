# import/no-unused-modules

Reports:
  - modules without any or
  - individual exports not being used within other modules

## Rule Details


### Options

This rule takes the following option:

- `src`: an array with files/paths to be analyzed. It only for applies for unused exports  
- `ignore`: an array with files/paths to be ignored. It only for applies for unused exports  
- `missingExports`: if `true`, files without any exports are reported  
- `unusedExports`: if `true`, exports without any usage are reported


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
given file-c:
```js
import { e } from 'file-a'
import { f } from 'file-b'

export default 7 // will be reported
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



## When not to use

If you don't mind having unused files or dead code within your codebase, you can disable this rule