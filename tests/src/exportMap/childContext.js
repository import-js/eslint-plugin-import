import { expect } from 'chai';

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
    parser: {},
  };

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
});
