# eslint-plugin-modules
ESLint rules for JavaScript modules.

### Installation

`npm install --save-dev eslint-plugin-modules`

### Usage

Add the following to your `.eslintrc` file:

```js
"plugins": [
  "modules"
]
```
### Rules

All of these rules have to do with JavaScript modules in one way or another.

- `no-define` - avoid AMD style define()
- `no-cjs` - prefer es6 modules to CJS style require()
- `no-exports-typo` - avoid typos in your module.exports
- `no-mix-default-named` - disallow using both named and default es6 exports
