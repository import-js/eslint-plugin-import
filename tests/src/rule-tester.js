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

    // Pass constructor parser so per-test configs can inherit babel options
    const ctorParser = this._constructorConfig && this._constructorConfig.parser;

    this._tester.run(ruleName, rule, {
      valid: tests.valid
        .filter((t) => !FlatCompatRuleTester._hasUnavailableParser(t))
        .map((t) => FlatCompatRuleTester._flatCompatValid(t, ctorParser)),
      invalid: tests.invalid
        .filter((t) => !FlatCompatRuleTester._hasUnavailableParser(t))
        .map((t) => FlatCompatRuleTester._flatCompatInvalid(t, ctorParser)),
    });
  }

  static _flatCompatValid(config, ctorParser) {
    const converted = FlatCompatRuleTester._flatCompat(config, ctorParser);

    // ESLint v10 RuleTester does not allow 'errors' or 'output' on valid test cases
    if (eslintV10 && converted && typeof converted === 'object') {
      delete converted.errors;
      delete converted.output;
    }

    return converted;
  }

  static _flatCompatInvalid(config, ctorParser) {
    const converted = FlatCompatRuleTester._flatCompat(config, ctorParser);

    // ESLint v10 removed the 'type' property from invalid test case error assertions
    if (eslintV10 && converted && typeof converted === 'object' && Array.isArray(converted.errors)) {
      converted.errors = converted.errors.map((error) => {
        if (error && typeof error === 'object') {
          return Object.fromEntries(Object.entries(error).filter(([key]) => key !== 'type'));
        }
        return error;
      });
    }

    return converted;
  }

  // @babel/eslint-parser requires explicit config; babel-eslint enabled all syntax by default.
  // When tests use @babel/eslint-parser (via parsers.BABEL_OLD on v10), inject the equivalent config.
  static _babelParserOptions(parser) {
    if (typeof parser !== 'string' || !parser.includes('@babel/eslint-parser')) {
      return null;
    }
    return {
      requireConfigFile: false,
      babelOptions: {
        configFile: false,
        babelrc: false, // the project's .babelrc is for babel-register (Babel 6 build toolchain), not for parsing test snippets
        parserOpts: {
          plugins: ['flow', ['decorators', { decoratorsBeforeExport: true }], 'exportDefaultFrom'],
        },
      },
    };
  }

  static _flatCompat(config, ctorParser) {
    if (!config || !usingFlatConfig || typeof config !== 'object') {
      return config;
    }

    const { parser, parserOptions = {}, languageOptions = {}, ...remainingConfig  } = config;
    const { ecmaVersion, sourceType, ...remainingParserOptions } = parserOptions;
    const parserObj = typeof parser === 'string' ? require(parser) : parser;

    // Inject babelOptions if either this test or the constructor uses @babel/eslint-parser.
    // Deep-merge babelOptions so test-specific values override defaults but babelrc/configFile survive.
    const babelOpts = FlatCompatRuleTester._babelParserOptions(parser)
      || FlatCompatRuleTester._babelParserOptions(ctorParser);
    let flatParserOptions;
    if (babelOpts) {
      const { babelOptions: defaultBabelOptions, ...defaultRest } = babelOpts;
      const { babelOptions: testBabelOptions, ...testRest } = remainingParserOptions;
      flatParserOptions = {
        ...defaultRest,
        ...testRest,
        babelOptions: { ...defaultBabelOptions, ...testBabelOptions },
      };
    } else {
      flatParserOptions = { ...remainingParserOptions };
    }

    return {
      ...remainingConfig,
      languageOptions: {
        ...languageOptions,
        ...parserObj ? { parser: parserObj } : {},
        ...ecmaVersion ? { ecmaVersion } : {},
        ...sourceType ? { sourceType } : {},
        // Only set parserOptions if non-empty, to avoid overriding constructor parserOptions
        ...Object.keys(flatParserOptions).length > 0 ? { parserOptions: flatParserOptions } : {},
      },
    };
  }
}

export { FlatCompatRuleTester as RuleTester };
