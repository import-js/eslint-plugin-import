# import/path

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

Enforce paths of `require()` / `import` statements to be "absolute" or "relative".

## Rule Details
This rule enforces module paths in `require()` / `import` statements to be "relative"
or "absolute" (relative to the project root).

## Options
This rule has one object option that has two properties:
- `underSameDirectory`: Specifies the rule for modules under the same directory of the current file.
- `other`: Specifies the rule for modules *not* under the same directory of the current file.

Each property can have one of the following values:
- `relative`: The module path should be relative to the current file.
- `absolute`: The module path should be absolute (relative to the project root).

Default:
```json
{
  "underSameDirectory": "relative",
  "other": "relative"
}
```

### underSameDirectory
Example of **incorrect** code for this rule with the `{ "underSameDirectory": "relative" }` options:
```ts
// Current file "src/home/foo.ts"
import bar from 'src/home/bar'; // Imports under the same directory of the current file must be relative to the current file.
```

Example of **correct** code for this rule with the `{ "underSameDirectory": "relative" }` options:
```ts
// Current file "src/home/foo.ts"
import bar from './bar';
```

### other
Example of **incorrect** code for this rule with the `{ "other": "absolute" }` options:
```ts
// Current file "src/home/foo.ts"
import bar from '../away/bar'; // Imports under the same directory of the current file must be relative to the current file.
```

Example of **correct** code for this rule with the `{ "other": "absolute" }` options:
```ts
// Current file "src/foo.ts"
import bar from 'src/away/bar';
```
