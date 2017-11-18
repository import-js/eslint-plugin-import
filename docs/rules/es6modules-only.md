# es6modules-only

Ensures that the imported file is an ES6 modules / use ES6 export statement.

It's good to use it together with [no-unresolved](./no-unresolved.md)

By default it parse only ES6 import statement, but it is possible to enable it for commonjs / amd (if it make sense to someone) by setting `{ commonjs: true/false, amd: true/false }` as a rule option.

## Rule Details

### Options

By default, only ES6 imports will be resolved:

```js
/*eslint import/es6modules-only: 2*/
import x from './foo' // reports if './foo' is not an es6 module

const y = require './bar' // will not report even if './bar' is not an es6 module
```

#### `ignore`

This rule has its own ignore list, separate from [`import/ignore`]. This is because you may want to ignore some external modules which do not provide es6 version.

```js
/*eslint import/es6modules-only: "import/es6modules-only": [2, { "ignore": ["react"] }]*/

import react from 'react' // will not be reported, even if not and es6 module

import lodash from 'lodash' // will be reported (if not and es6 module)
```

```js
/*eslint import/es6modules-only: "import/es6modules-only": [2, { "ignore": [".styl"] }]*/

import 'basicStyles.styl' // will not be reported

```

## When To Use It

If you want to have es6 only project, and mainly if you want to use tree shaking and other optiomizations. Because it is often hard or even imposible to use it with commonjs / amd modules.

## Further Reading

- [Webpack treeshaking](https://webpack.js.org/guides/tree-shaking/)
- [Webpack harmony-unused example](https://github.com/webpack/webpack/tree/master/examples/harmony-unused)
- [ES6 modules chapter in Exploring JS](http://exploringjs.com/es6/ch_modules.html)