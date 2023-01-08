
This rules helps to define type import patterns for the typescript.

## Rule details
This rule allows you to specify how type imports should be written in your TypeScript code. There are two options available: inline type imports and separate type import statements. Rule can also autofix your type imports to the preferred style.

The rule has 2 modes: strict and preference.

Strict option enforces either inline type imports with type modifiers, or separate type imports.

If you select the preference mode, the rule will check for the availability of your preferred import style and use that if possible. If not, it will fall back to your second preferred option.

For example, if you specify the preference as ["inline", "separate"], the rule will try to use inline type imports first. If that is not supported by your TypeScript version, it will use separate type import statements instead.


#### Rule schema 

```javascript
// strict mode
"import/typescript-flow": [ 0 | 1 | 2, "inline" | "separate" ]

// preference mode
"import/typescript-flow": [ 0 | 1 | 2, [ "inline", "separate" ] | [ "separate", "inline" ] ]

```

### Strict mode

#### separate

**Definition**: Separate type import statements are written using the import type syntax. They were introduced in TypeScript 3.8

The following patterns are *not* considered warnings:

```javascript
// good1.js

// Separate import type statement
import type { MyType } from "./typescript.ts"
```

```javascript
// good2.js

// Separate import type statement
import type { MyType as Persona, Bar as Foo } from "./typescript.ts"
```
```javascript
// good3.js

// Default type imports are ignored
import type DefaultImport from "./typescript.ts"
```

```javascript
// good4.js

// Default imports are ignored
import DefaultImport from "./typescript.ts"
```

The following patterns are considered warnings:

```javascript
// bad1.js

// type imports must be imported in separate import type statement
import {type MyType,Bar} from "./typescript.ts"

// gets fixed to the following:
import {Bar} from "./typescript.ts"
import type { MyType } from "./typescript.ts"
```

```javascript
// bad2.js

// type imports must be imported in separate import type statement
import {type MyType,type Foo} from "./typescript.ts"

// gets fixed to the following:
import type { MyType, Foo} from "./typescript.ts"
```

```javascript
// bad3.js

// type imports must be imported in separate import type statement
import {type MyType as Persona,Bar,type Foo as Baz} from "./typescript.ts"

// gets fixed to the following:
import {Bar} from "./typescript.ts"
import type { MyType as Persona, Foo as Baz } from "./typescript.ts"
```

#### inline

**Definition**: Inline type imports are written as type modifiers within the curly braces of a regular import statement. They were introduced in TypeScript 4.5.

Patterns that do not raise the warning:

```javascript
// good1.js

// no separate import type statement. inline type import exists
import { type MyType } from "./typescript.ts"
```

```javascript
// good2.js

// no separate import type statement. inline type import exists
import { type MyType, Bar, type Foo as Baz } from "./typescript.ts"
```

Patterns are considered warnings and fixed:

```javascript
// bad1.js

// type imports must be imported inline
import type {MyType} from "./typescript.ts"

// gets fixed to the following:
import  {type MyType} from "./typescript.ts"
```

```javascript
// bad1.js

// type imports must be imported inline
import type {MyType, Bar} from "./typescript.ts"

// gets fixed to the following:
import  {type MyType, type Bar} from "./typescript.ts"
```

```javascript
// bad3.js

// type imports must be imported inline
import type {MyType, Bar} from "./typescript.ts"
import {Value} from "./typescript.ts"

// Rule can check if there are any other imports from the same source. If yes, then adds inline type imports there. gets fixed to the following:
import {Value, type MyType, type Bar} from "./typescript.ts"
```

### Preference mode

```javascript
// preference mode where inline comes first
"import/typescript-flow": [ 0 | 1 | 2, [ "inline", "separate" ] ]
```
Rule checks if `inline` type modifiers are supported by TypeScript version (must be >=4.5). If supported, then rule operates with `inline` option, if not, then it falls back to `separate` option.

```javascript
// preference mode where strict comes first
"import/typescript-flow": [ 0 | 1 | 2, [ "separate", "inline" ] ]
```

If `separate` comes first in preferred order, then rule will act as if user chose `separate`.

Since `separate` type imports are supported in TypeScript version 3.8 and above, and `inline` type imports are supported in version 4.5 and above, the `separate` option is guaranteed to be supported if the `inline` option is supported. Therefore, there is no need to consider the case where the `separate` option is not supported and the rule falls back to the `inline` option.