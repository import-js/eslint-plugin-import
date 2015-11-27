# eslint-import-resolver-node

[![npm](https://img.shields.io/npm/v/eslint-import-resolver-node.svg)](https://www.npmjs.com/package/eslint-import-resolver-node)

Default Node-style module resolution plugin for [`eslint-plugin-import`](https://www.npmjs.com/package/eslint-plugin-import).

Published separately to allow pegging to a specific version in case of breaking
changes.

Config is passed directly through to [`resolve`](https://www.npmjs.com/package/resolve) as options:

```yaml
settings:
  import/resolver:
    node:
      moduleDirectory:
        - node_modules
        - src
```

or to use the default options:

```yaml
settings:
  import/resolver: node
```
