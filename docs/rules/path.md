# import/path

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

Enforce paths of `require()` / `import` statements to be relative to the current file or the project root.

## Rule Details
This rule enforces module paths in `require()` / `import` statements to be relative to the current file
or relative to the project root.

## Options
This rule has one object option that has the following properties:
- `underSameDirectory`: Specifies the rule for modules under the same directory of the current file.
- `other`: Specifies the rule for modules *not* under the same directory of the current file.
- `root`: Specifies the project root. If not specified, this rule will try to use the `baseUrl` defined in tsconfig.json.
  See [TypeScript TSConfig Reference](https://www.typescriptlang.org/tsconfig#baseUrl) for details.

`underSameDirectory` and `other` can have one of the following values:
- `relativeToCurrent`: The module path should be relative to the current file.
- `relativeToRoot`: The module path should be relative to the project root.

Default:
```json
{
  "underSameDirectory": "relative",
  "other": "relative"
}
```

### underSameDirectory
Example of **incorrect** code for this rule with the `{ "underSameDirectory": "relativeToCurrent" }` options:
```ts
// Current file "/project/src/home/foo.ts"
import bar from 'src/home/bar'; // Imports under the same directory of the current file must be relative to the current file.
```

Example of **correct** code for this rule with the `{ "underSameDirectory": "relativeToCurrent" }` options:
```ts
// Current file "/project/src/home/foo.ts"
import bar from './bar';
```

### other
Example of **incorrect** code for this rule with the `{ "other": "relativeToRoot", "root": "/project" }` options:
```ts
// Current file "/project/src/home/foo.ts"
import bar from '../away/bar'; // Imports under the same directory of the current file must be relative to the current file.
```

Example of **correct** code for this rule with the `{ "other": "relativeToRoot", "root": "/project" }` options:
```ts
// Current file "/project/src/home/foo.ts"
import bar from 'src/away/bar';
```
