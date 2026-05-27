import { expect } from 'chai';
import path from 'path';

import { listFilesUsingFileEnumerator } from 'core/listFilesToProcess';
import { getFilename } from '../utils';

// Reuses the listFilesWithNodeFs fixtures (see tests/src/core/listFilesWithNodeFs.js
// for the layout); here we only need a directory the fs fallback can enumerate.
const root = getFilename('listFilesWithNodeFs');
const f = (...segments) => path.join(root, ...segments);

// Minimal stand-ins for eslint's internal `FileEnumerator`, so the fallback
// branches can be exercised in-process on any eslint version.
function StubFileEnumerator() {}
StubFileEnumerator.prototype.iterateFiles = function* iterateFiles() {
  yield { filePath: f('src', 'a.js'), ignored: false };
  yield { filePath: f('src', 'b.js'), ignored: true };
};

function makeThrowingEnumerator(message) {
  function ThrowingFileEnumerator() {}
  ThrowingFileEnumerator.prototype.iterateFiles = function iterateFiles() {
    throw new Error(message);
  };
  return ThrowingFileEnumerator;
}

describe('listFilesToProcess', function () {
  describe('listFilesUsingFileEnumerator', function () {
    const originalFlatConfig = process.env.ESLINT_USE_FLAT_CONFIG;
    afterEach(function () {
      if (originalFlatConfig === undefined) {
        delete process.env.ESLINT_USE_FLAT_CONFIG;
      } else {
        process.env.ESLINT_USE_FLAT_CONFIG = originalFlatConfig;
      }
    });

    it('maps the enumerator output to { filename, ignored }', function () {
      expect(listFilesUsingFileEnumerator(StubFileEnumerator, [root], ['.js'])).to.deep.equal([
        { filename: f('src', 'a.js'), ignored: false },
        { filename: f('src', 'b.js'), ignored: true },
      ]);
    });

    // #3079: flat config without .eslintrc — the enumerator throws, so fall back to fs.
    it('falls back to listFilesWithNodeFs on flat config when no eslintrc is found', function () {
      process.env.ESLINT_USE_FLAT_CONFIG = 'true';
      const Enumerator = makeThrowingEnumerator('No ESLint configuration found in .');
      expect(listFilesUsingFileEnumerator(Enumerator, [f('src', 'a*.js')], ['.js'])).to.deep.equal([
        f('src', 'a.js'),
      ]);
    });

    it('rethrows the "no configuration" error when not using flat config', function () {
      process.env.ESLINT_USE_FLAT_CONFIG = 'false';
      const Enumerator = makeThrowingEnumerator('No ESLint configuration found in .');
      expect(() => listFilesUsingFileEnumerator(Enumerator, [root], ['.js'])).to.throw('No ESLint configuration found');
    });

    it('rethrows unrelated enumerator errors even on flat config', function () {
      process.env.ESLINT_USE_FLAT_CONFIG = 'true';
      const Enumerator = makeThrowingEnumerator('some other failure');
      expect(() => listFilesUsingFileEnumerator(Enumerator, [root], ['.js'])).to.throw('some other failure');
    });
  });
});
