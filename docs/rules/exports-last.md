# exports-last

This rule reports all export declaration which come before any non-export statements.

## This will be reported

```JS

const bool = true

export default bool

const str = 'foo'

```

```JS

export const bool = true

const str = 'foo'

```

## This will not be reported

```JS
export const bool = true

export default bool

export function func() {
  console.log('Hello World 🌍')
}

export const str = 'foo'
```

## When Not To Use It

If you don't mind exports being sprinkled throughout a file, you may not want to enable this rule.
