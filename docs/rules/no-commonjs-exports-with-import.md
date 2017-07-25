# no-commonjs-exports-with-import

Reports if you use `import` in the same file that `module.exports` or
`exports.*` is used.

webpack will break the bundle if you use `import` in the same file that
`module.exports` is used, but it will appear to build pretty alright. When this
happens, webpack outputs a warning like:

```
WARNING in ./foo.js
4:12-13 "export 'default' (imported as 'bar') was not found in './bar'
```

And when the JS is run in the browser, an error like the following is
logged:

```
Uncaught TypeError: Cannot assign to read only property 'exports' of
object '#<Object>'
```

This rule makes webpack safer to use in this way.

## Rule Details

The following patterns are considered warnings:

```js
import foo from './foo';
module.exports = foo;
```

The following patterns are not warnings:

```js
// best
import foo from './foo';
export default foo;
```

```js
// ok
const foo = require('./foo');
module.exports = foo;
```

```js
// weird
const foo = require('./foo');
export default foo;
```
