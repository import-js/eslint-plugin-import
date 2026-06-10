import { expect } from 'chai';

import sourceType from 'core/sourceType';

describe('sourceType', function () {
  it('reads sourceType from languageOptions (flat config)', function () {
    expect(sourceType({ languageOptions: { sourceType: 'module' } })).to.equal('module');
  });

  it('reads sourceType from parserOptions (legacy eslintrc)', function () {
    expect(sourceType({ parserOptions: { sourceType: 'module' } })).to.equal('module');
  });

  it('prefers languageOptions when both are present', function () {
    expect(sourceType({
      languageOptions: { sourceType: 'module' },
      parserOptions: { sourceType: 'script' },
    })).to.equal('module');
  });

  it('does not throw when parserOptions is absent (ESLint v10 flat config)', function () {
    expect(() => sourceType({ languageOptions: { sourceType: 'module' } })).not.to.throw();
    expect(sourceType({})).to.equal(undefined);
  });
});
