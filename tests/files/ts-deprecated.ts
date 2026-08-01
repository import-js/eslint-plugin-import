/**
 * this is what you get when you trust a mouse talk show
 * @deprecated don't use this!
 * @returns {string} nonsense
 */
export function foo() {
  return 'bar'
}

function decorate() {
  return () => {};
}

/**
 * @deprecated don't use this class!
 */
@decorate()
export class DeprecatedClass {}

/**
 * @deprecated don't use this default class!
 */
@decorate()
export default class DeprecatedDefaultClass {}

// this comment must stay above the decorator, to cover a doc between decorator and export
@decorate()
/**
 * @deprecated don't use this between class!
 */
export class DeprecatedBetweenClass {}

@decorate()
/**
 * @deprecated this doc is sandwiched between decorators, and documents nothing!
 */
@decorate()
export class NotDeprecatedSandwichClass {}
