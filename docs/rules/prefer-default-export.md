# prefer-default-export

When there is only a single export from a module prefer using default export over named export.

## Rule Details

The following patterns are considered warnings:

```javascript
// bad.js

// There is only a single module export and its a named export.
export const foo = 'foo';

```

The following patterns are not warnings:

```javascript
// good1.js

// There is a default export.
export const foo = 'foo';
const bar = 'bar';
export default 'bar';
```

```javascript
// good2.js

// There is more thank one named exports in the module.
export const foo = 'foo';
export const bar = 'bar';
```

```javascript
// good3.js

// There is more thank one named exports in the module
const foo = 'foo';
const bar = 'bar';
export { foo, bar }
```

```javascript
// good4.js

// There is a default export.
const foo = 'foo';
export { foo as default }
```

```javascript
// good5.js

// export multiple vars through deconstructing.
export const { foo, bar } = baz;
```
