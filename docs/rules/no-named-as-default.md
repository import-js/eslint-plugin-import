# no-named-as-default

Reports use of an exported name as the locally imported name of a default export.

Rationale: using an exported name as the name of the default export is likely...

- *misleading*: others familiar with `foo.js` probably expect the name to be `foo`
- *a mistake*: only needed to import `bar` and forgot the brackets (the case that is prompting this)

## Rule Details

Given:
```js
// foo.js
export default 'foo';
export const bar = 'baz';
```

...this would be valid:
```js
import foo from './foo.js';
```

...and this would be reported:
```js
// message: Using exported name 'bar' as identifier for default export.
import bar from './foo.js';
```

For [ES7], this also prevents exporting the default from a referenced module as a name within than module, for the same reasons:

```js
// valid:
export foo from './foo.js'

// message: Using exported name 'bar' as identifier for default export.
export bar from './foo.js';
```

## Further Reading

- Lee Byron's [ES7] export proposal

[ES7]: https://github.com/leebyron/ecmascript-more-export-from
