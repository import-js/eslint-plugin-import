import { expect } from 'chai'

import isIgnored, { getFileExtensions, hasValidExtension } from 'eslint-module-utils/ignore'

import * as utils from '../utils'

describe('ignore', function () {
  describe('isIgnored', function () {
    it('ignores paths with extensions other than .js', function () {
      const testContext = utils.testContext({})

      expect(isIgnored('../files/foo.js', testContext)).to.equal(false)

      expect(isIgnored('../files/bar.jsx', testContext)).to.equal(true)

      expect(isIgnored('../files/typescript.ts', testContext)).to.equal(true)

      expect(isIgnored('../files/ignore.invalid.extension', testContext)).to.equal(true)
    })

    it('ignores paths with invalid extensions when configured with import/extensions', function () {
      const testContext = utils.testContext({ 'import/extensions': [ '.js', '.jsx', '.ts' ] })

      expect(isIgnored('../files/foo.js', testContext)).to.equal(false)

      expect(isIgnored('../files/bar.jsx', testContext)).to.equal(false)

      expect(isIgnored('../files/typescript.ts', testContext)).to.equal(false)

      expect(isIgnored('../files/ignore.invalid.extension', testContext)).to.equal(true)
    })
  })

  describe('hasValidExtension', function () {
    it('assumes only .js as valid by default', function () {
      const testContext = utils.testContext({})

      expect(hasValidExtension('../files/foo.js', testContext)).to.equal(true)

      expect(hasValidExtension('../files/foo.jsx', testContext)).to.equal(false)

      expect(hasValidExtension('../files/foo.css', testContext)).to.equal(false)

      expect(hasValidExtension('../files/foo.invalid.extension', testContext)).to.equal(false)
    })

    it('can be configured with import/extensions', function () {
      const testContext = utils.testContext({ 'import/extensions': [ '.foo', '.bar' ] })

      expect(hasValidExtension('../files/foo.foo', testContext)).to.equal(true)

      expect(hasValidExtension('../files/foo.bar', testContext)).to.equal(true)

      expect(hasValidExtension('../files/foo.js', testContext)).to.equal(false)
    })
  })

  describe('getFileExtensions', function () {
    it('returns a set with the file extension ".js" if "import/extensions" is not configured', function () {
      const fileExtensions = getFileExtensions({})

      expect(fileExtensions).to.include('.js')
    })

    it('returns a set with the file extensions configured in "import/extension"', function () {
      const settings = {
        'import/extensions': ['.js', '.jsx'],
      }

      const fileExtensions = getFileExtensions(settings)

      expect(fileExtensions).to.include('.js')
      expect(fileExtensions).to.include('.jsx')
    })

    it('returns a set with the file extensions configured in "import/extension" and "import/parsers"', function () {
      const settings = {
        'import/parsers': {
          'typescript-eslint-parser': ['.ts', '.tsx'],
        },
      }

      const fileExtensions = getFileExtensions(settings)

      expect(fileExtensions).to.include('.js') // If "import/extensions" is not configured, this is the default
      expect(fileExtensions).to.include('.ts')
      expect(fileExtensions).to.include('.tsx')
    })
  })
})
