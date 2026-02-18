import { RuleTester } from 'eslint';
import { version as eslintVersion } from 'eslint/package.json';
import semver from 'semver';

export const usingFlatConfig = semver.major(eslintVersion) >= 9;
const eslintV10 = semver.major(eslintVersion) >= 10;

export function withoutAutofixOutput(test) {
  return { ...test, ...usingFlatConfig || { output: test.code } };
}

class FlatCompatRuleTester {
  constructor(testerConfig = { parserOptions: { sourceType: 'script' } }) {
    this._constructorConfig = testerConfig;
    this._tester = new RuleTester(FlatCompatRuleTester._flatCompat(testerConfig));
  }

  // Skip tests that reference a parser that resolved to `false` (unavailable for this ESLint version)
  static _hasUnavailableParser(t) {
    return t && typeof t === 'object' && 'parser' in t && t.parser === false;
  }

  // Check if a parser resolved to `false` (unavailable for this ESLint version)
  static _isUnavailableParser(parser) {
    return parser === false;
  }

  run(ruleName, rule, tests) {
    // Skip entire suite if the constructor parser is unavailable in this ESLint version
    if (FlatCompatRuleTester._isUnavailableParser(
      this._constructorConfig && this._constructorConfig.parser,
    )) {
      return;
    }

    this._tester.run(ruleName, rule, {
      valid: tests.valid
        .filter((t) => !FlatCompatRuleTester._hasUnavailableParser(t))
        .map((t) => FlatCompatRuleTester._flatCompatValid(t)),
      invalid: tests.invalid
        .filter((t) => !FlatCompatRuleTester._hasUnavailableParser(t))
        .map((t) => FlatCompatRuleTester._flatCompatInvalid(t)),
    });
  }

  static _flatCompatValid(config) {
    const converted = FlatCompatRuleTester._flatCompat(config);

    // ESLint v10 RuleTester does not allow 'errors' or 'output' on valid test cases
    if (eslintV10 && converted && typeof converted === 'object') {
      delete converted.errors;
      delete converted.output;
    }

    return converted;
  }

  static _flatCompatInvalid(config) {
    const converted = FlatCompatRuleTester._flatCompat(config);

    // ESLint v10 removed the 'type' property from invalid test case error assertions
    if (eslintV10 && converted && typeof converted === 'object' && Array.isArray(converted.errors)) {
      converted.errors = converted.errors.map((error) => {
        if (error && typeof error === 'object') {
          const { type, ...rest } = error;
          return rest;
        }
        return error;
      });
    }

    return converted;
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
