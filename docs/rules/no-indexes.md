# import/no-indexes

This rule prevents files from being named `index`.

For example, with the `no-indexes` rule enabled, files named `index.js`, `index.jsx`, `index.ts`, and `index.tsx` would all be considered invalid.

## Ignore

The rule accepts an optional `ignore` setting, which can be used to ignore any file whose path matches one of the given regular expression patterns.

For example, the following would allow `index` files in the `allowed` directory:

```
{
  rules: {
    'import/no-indexes': [
      'error',
      { ignore: ['\/allowed\/'] }
    ]
  }
}
```
