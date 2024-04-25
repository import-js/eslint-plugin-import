import { RuleTester } from 'eslint';
import { version as eslintVersion } from 'eslint/package.json';
import semver from 'semver';

export const usingFlatConfig = semver.major(eslintVersion) >= 9;

export function withoutAutofixOutput(test) {
  return { ...test, output: usingFlatConfig ? null : test.code };
}

export class FlatCompatRuleTester {
  constructor(testerConfig) {
    this._tester = new RuleTester(FlatCompatRuleTester._flatCompat(testerConfig));
  }

  run(
    ruleName,
    rule,
    tests,
  ) {
    this._tester.run(ruleName, rule, {
      valid: tests.valid.map((t) => FlatCompatRuleTester._flatCompat(t)),
      invalid: tests.invalid.map((t) => FlatCompatRuleTester._flatCompat(t)),
    });
  }

  static _flatCompat(config) {
    if (!config || !usingFlatConfig || typeof config === 'string') {
      return config;
    }

    const obj = {
      languageOptions: { parserOptions: {} },
    };

    for (const [key, value] of Object.entries(config)) {
      if (key === 'parser') {
        obj.languageOptions.parser = typeof value === 'string' ? require(value) : value;

        continue;
      }

      if (key === 'parserOptions') {
        for (const [option, val] of Object.entries(value)) {
          if (option === 'ecmaVersion' || option === 'sourceType') {
            obj.languageOptions[option] = val;

            continue;
          }

          obj.languageOptions.parserOptions[option] = val;
        }

        continue;
      }

      obj[key] = value;
    }

    return obj;
  }
}
