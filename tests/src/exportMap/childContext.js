import { expect } from 'chai';
import { hashObject } from 'eslint-module-utils/hash';

import childContext from '../../../src/exportMap/childContext';

describe('childContext', () => {
  const settings = {
    setting1: true,
    setting2: false,
  };
  const parserOptions = {
    ecmaVersion: 'latest',
    sourceType: 'module',
  };
  const parserPath = 'path/to/parser';
  const path = 'path/to/src/file';
  const languageOptions = {
    ecmaVersion: 2024,
    sourceType: 'module',
    parser: {
      parseForESLint() { return 'parser1'; },
    },
  };
  const languageOptionsHash = hashObject({ languageOptions }).digest('hex');
  const parserOptionsHash = hashObject({ parserOptions }).digest('hex');
  const settingsHash = hashObject({ settings }).digest('hex');

  // https://github.com/import-js/eslint-plugin-import/issues/3051
  it('should pass context properties through, if present', () => {
    const mockContext = {
      settings,
      parserOptions,
      parserPath,
      languageOptions,
    };

    const result = childContext(path, mockContext);

    expect(result.settings).to.deep.equal(settings);
    expect(result.parserOptions).to.deep.equal(parserOptions);
    expect(result.parserPath).to.equal(parserPath);
    expect(result.languageOptions).to.deep.equal(languageOptions);
  });

  it('should add path and cacheKey to context', () => {
    const mockContext = {
      settings,
      parserOptions,
      parserPath,
    };

    const result = childContext(path, mockContext);

    expect(result.path).to.equal(path);
    expect(result.cacheKey).to.be.a('string');
  });

  it('should construct cache key out of languageOptions if present', () => {
    const mockContext = {
      settings,
      languageOptions,
    };

    const result = childContext(path, mockContext);

    expect(result.cacheKey).to.equal(languageOptionsHash + settingsHash + path);
  });

  it('should use the same cache key upon multiple calls', () => {
    const mockContext = {
      settings,
      languageOptions,
    };

    let result = childContext(path, mockContext);

    const expectedCacheKey = languageOptionsHash + settingsHash + path;
    expect(result.cacheKey).to.equal(expectedCacheKey);

    result = childContext(path, mockContext);
    expect(result.cacheKey).to.equal(expectedCacheKey);
  });

  it('should update cacheKey if different languageOptions are passed in', () => {
    const mockContext = {
      settings,
      languageOptions,
    };

    let result = childContext(path, mockContext);

    const firstCacheKey = languageOptionsHash + settingsHash + path;
    expect(result.cacheKey).to.equal(firstCacheKey);

    // Second run with different parser function
    mockContext.languageOptions = {
      ...languageOptions,
      parser: {
        parseForESLint() { return 'parser2'; },
      },
    };

    result = childContext(path, mockContext);

    const secondCacheKey = hashObject({ languageOptions: mockContext.languageOptions }).digest('hex') + settingsHash + path;
    expect(result.cacheKey).to.not.equal(firstCacheKey);
    expect(result.cacheKey).to.equal(secondCacheKey);
  });

  it('should construct cache key out of parserOptions and parserPath if no languageOptions', () => {
    const mockContext = {
      settings,
      parserOptions,
      parserPath,
    };

    const result = childContext(path, mockContext);

    expect(result.cacheKey).to.equal(String(parserPath) + parserOptionsHash + settingsHash + path);
  });
});
