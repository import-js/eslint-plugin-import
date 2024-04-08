import { RuleTester } from 'eslint';
import { version as eslintVersion } from 'eslint/package.json';
import semver from 'semver';

export const usingFlatConfig = semver.major(eslintVersion) >= 9;

export function withoutAutofixOutput(test) {
  return { ...test, ...usingFlatConfig || { output: test.code } };
}

class FlatCompatRuleTester {
  constructor(testerConfig = { parserOptions: { sourceType: 'script' } }) {
    this._tester = new RuleTester(FlatCompatRuleTester._flatCompat(testerConfig));
  }

  run(ruleName, rule, tests) {
    this._tester.run(ruleName, rule, {
      valid: tests.valid.map((t) => FlatCompatRuleTester._flatCompat(t)),
      invalid: tests.invalid.map((t) => FlatCompatRuleTester._flatCompat(t)),
    });
  }

  static _flatCompat(config) {
    if (!config || !usingFlatConfig || typeof config !== 'object') {
      return config;
    }

    const { parser, parserOptions = {}, languageOptions = {}, ...remainingConfig  } = config;
    const { ecmaVersion, sourceType, ...remainingParserOptions } = parserOptions;
    const parserObj = typeof parser === 'string' ? require(parser) : parser;

    return {
      ...remainingConfig,
      languageOptions: {
        ...languageOptions,
        ...parserObj ? { parser: parserObj } : {},
        ...ecmaVersion ? { ecmaVersion } : {},
        ...sourceType ? { sourceType } : {},
        parserOptions: {
          ...remainingParserOptions,
        },
      },
    };
  }
}

export { FlatCompatRuleTester as RuleTester };
