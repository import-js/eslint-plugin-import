/**
 * @param {import('eslint').Rule.RuleContext} context
 * @returns 'module' | 'script' | 'commonjs' | undefined
 */
export default function sourceType(context) {
  if ('languageOptions' in context && context.languageOptions) {
    return context.languageOptions.sourceType;
  }
  if (context.parserOptions && 'sourceType' in context.parserOptions) {
    return context.parserOptions.sourceType;
  }
}
