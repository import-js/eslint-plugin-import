# no-mutable-exports

Forbids the use of mutable exports with `var` or `let`.

## Rule Details

Valid:

```js
export const count = 1
export function getCount() {}
```

...whereas here exports will be reported:

```js
export let count = 2
export var count = 3
```

## When Not To Use It

If your environment correctly implements mutable export bindings.
