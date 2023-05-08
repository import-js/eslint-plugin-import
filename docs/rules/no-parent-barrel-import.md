# import/no-parent-barrel-import

<!-- end auto-generated rule header -->

Forbid a module from importing from parent barrel file, as it often leads to runtime error `Cannot read ... of undefined`.

It resolves the missing circular import check from [`no-self-import`], while being computationally cheap (see [`no-cycle`]).

## Rule Details

### Fail

```js
// @foo/index.ts
export * from "./bar";

// @foo/bar/index.ts
export * from "./baz";
export * from "./qux";

// @foo/bar/baz.ts (cannot read property `X` of undefined)
import { T } from '../..';     // relative
import { T } from '..';        // relative
import { T } from '@foo';      // absolute
import { T } from '@foo/bar';  // absolute

export const X = T.X;

// @foo/bar/qux.ts
export enum T {
  X = "..."
}
```

### Pass

```js
// @foo/index.ts
export * from "./bar";

// @foo/bar/index.ts
export * from "./baz";
export * from "./qux";

// @foo/bar/baz.ts (relative import for code in `@foo`)
import { T } from "./baz";         // relative
import { T } from "@foo/bar/qux";  // absolute

export const X = T.X;

// @foo/bar/qux.ts
export enum T {
  X = "..."
}
```

## Further Reading

- [Related Discussion](https://github.com/import-js/eslint-plugin-import/pull/2318#issuecomment-1027807460)
- Rule to detect that module imports itself: [`no-self-import`], [`no-cycle`]

[`no-self-import`]: ./no-self-import.md
[`no-cycle`]: ./no-cycle.md
