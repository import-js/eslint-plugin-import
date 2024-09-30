/**
 * @param {import('eslint').Rule.RuleContext} context
 * @returns 'module' | 'script' | undefined
 */
export default function sourceType(context) {
  return context.parserOptions.sourceType;
}
