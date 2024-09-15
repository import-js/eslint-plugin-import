/**
 * @param {import('eslint').Rule.RuleContext} context
 * @returns 'module' | 'script' | 'commonjs' | undefined
 */
export default function sourceType(context) {
  if ('sourceType' in context.parserOptions) {
    return context.parserOptions.sourceType;
  }
  if ('languageOptions' in context && context.languageOptions) {
    return context.languageOptions.sourceType;
  }
}
