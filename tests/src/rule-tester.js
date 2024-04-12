export function withoutAutofixOutput(test) {
  return { ...test, output: test.code };
}
