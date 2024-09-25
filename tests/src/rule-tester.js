export function withoutAutofixOutput(test) {
  return { ...test, output: test.code };
}

export { RuleTester } from 'eslint';
