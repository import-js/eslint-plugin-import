# eslint-import-resolver-webpack

[![npm](https://img.shields.io/npm/v/eslint-import-resolver-webpack.svg)](https://www.npmjs.com/package/eslint-import-resolver-webpack)

Webpack-literate module resolution plugin for [`eslint-plugin-import`](https://www.npmjs.com/package/eslint-plugin-import).

> :boom: Only "synchronous" Webpack configs are supported at the moment.
> If your config returns a `Promise`, this will cause problems.
> Consider splitting your asynchronous configuration to a separate config.

Published separately to allow pegging to a specific version in case of breaking
changes.

To use with `eslint-plugin-import`, run:

```
npm i eslint-import-resolver-webpack -g
```

or if you manage ESLint as a dev dependency:

```
# inside your project's working tree
npm install eslint-import-resolver-webpack --save-dev
```

Will look for `webpack.config.js` as a sibling of the first ancestral `package.json`,
or a `config` parameter may be provided with another filename/path either relative to the
`package.json`, or a complete, absolute path.

If multiple webpack configurations are found the first configuration containing a resolve section will be used. Optionally, the `config-index` (zero-based) setting can be used to select a specific configuration.

```yaml
---
settings:
  import/resolver: webpack  # take all defaults
```

or with explicit config file name:

```yaml
---
settings:
  import/resolver:
    webpack:
      config: 'webpack.dev.config.js'
```

or with explicit config file index:

```yaml
---
settings:
  import/resolver:
    webpack:
      config: 'webpack.multiple.config.js'
      config-index: 1   # take the config at index 1
```

or with explicit config file path relative to your projects's working directory:

```yaml
---
settings:
  import/resolver:
    webpack:
      config: './configs/webpack.dev.config.js'
```

or with explicit config object:

```yaml
---
settings:
  import/resolver:
    webpack:
      config:
        resolve:
          extensions:
            - .js
            - .jsx
```

If your config relies on [environment variables](https://webpack.js.org/guides/environment-variables/), they can be specified using the `env` parameter.  If your config is a function, it will be invoked with the value assigned to `env`:

```yaml
---
settings:
  import/resolver:
    webpack:
      config: 'webpack.config.js'
      env:
        NODE_ENV: 'local'
        production: true
```

## Support

[Get supported eslint-import-resolver-webpack with the Tidelift Subscription](https://tidelift.com/subscription/pkg/npm-eslint-import-resolver-webpack?utm_source=npm-eslint-import-resolver-webpack&utm_medium=referral&utm_campaign=readme)
