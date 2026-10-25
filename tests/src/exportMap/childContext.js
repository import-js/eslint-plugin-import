import { expect } from 'chai';
import sinon from 'sinon';
import * as hash from 'eslint-module-utils/hash';
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

  it('should update cacheKey if different settings are passed in', () => {
    const mockContext = {
      settings,
      languageOptions,
    };

    let result = childContext(path, mockContext);
    expect(result.cacheKey).to.equal(languageOptionsHash + settingsHash + path);

    mockContext.settings = { ...settings, setting2: true };

    result = childContext(path, mockContext);

    const secondSettingsHash = hashObject({ settings: mockContext.settings }).digest('hex');
    expect(secondSettingsHash).to.not.equal(settingsHash);
    expect(result.cacheKey).to.equal(languageOptionsHash + secondSettingsHash + path);
  });

  it('should update cacheKey if settings differ only in a function value', () => {
    const mockContext = {
      settings: { resolver() { return 1; } },
      languageOptions,
    };

    const firstCacheKey = childContext(path, mockContext).cacheKey;

    mockContext.settings = { resolver() { return 2; } };

    expect(childContext(path, mockContext).cacheKey).to.not.equal(firstCacheKey);
  });

  it('should keep cacheKey if equal settings arrive in a new object', () => {
    const mockContext = {
      settings,
      languageOptions,
    };

    const firstCacheKey = childContext(path, mockContext).cacheKey;

    mockContext.settings = { ...settings };

    expect(childContext(path, mockContext).cacheKey).to.equal(firstCacheKey);
  });

  it('should not rehash settings and options it has already seen', () => {
    const flatContext = {
      settings: { ...settings },
      languageOptions: { ...languageOptions },
    };
    const legacyContext = {
      settings: { ...settings },
      parserOptions: { ...parserOptions },
      parserPath,
    };

    const hashSpy = sinon.spy(hash, 'hashObject');
    try {
      [flatContext, legacyContext].forEach((mockContext) => {
        childContext(path, mockContext);
        const hashCount = hashSpy.callCount;

        childContext(path, mockContext);
        childContext('path/to/other/file', mockContext);

        expect(hashSpy.callCount).to.equal(hashCount);
      });
    } finally {
      hashSpy.restore();
    }
  });

  it('should update cacheKey if different parserOptions are passed in', () => {
    const mockContext = {
      settings,
      parserOptions,
      parserPath,
    };

    let result = childContext(path, mockContext);
    expect(result.cacheKey).to.equal(String(parserPath) + parserOptionsHash + settingsHash + path);

    mockContext.parserOptions = { ...parserOptions, sourceType: 'script' };

    result = childContext(path, mockContext);

    const secondParserOptionsHash = hashObject({ parserOptions: mockContext.parserOptions }).digest('hex');
    expect(secondParserOptionsHash).to.not.equal(parserOptionsHash);
    expect(result.cacheKey).to.equal(String(parserPath) + secondParserOptionsHash + settingsHash + path);
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
