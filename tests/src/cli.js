/**
 * tests that require fully booting up ESLint
 */
import { expect } from 'chai'
import { CLIEngine } from 'eslint'

describe('CLI regression tests', function () {
  describe('issue #210', function () {
    let cli
    before(function () {
      cli = new CLIEngine({
        useEslintrc: false,
        configFile: './tests/files/issue210.config.js',
        rulePaths: ['./src/rules'],
        rules: {
          'named': 2,
        },
      })
    })
    it("doesn't throw an error on gratuitous, erroneous self-reference", function () {
      expect(() => cli.executeOnFiles(['./tests/files/issue210.js'])).not.to.throw(Error)
    })
  })
})
