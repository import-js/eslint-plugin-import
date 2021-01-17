/**
 * tests that require fully booting up ESLint
 */
import path from 'path';

import { expect } from 'chai';
import { CLIEngine } from 'eslint';
import eslintPkg from 'eslint/package.json';
import semver from 'semver';

describe('CLI regression tests', function () {
  describe('issue #210', function () {
    let cli;
    before(function () {
      cli = new CLIEngine({
        useEslintrc: false,
        configFile: './tests/files/issue210.config.js',
        rulePaths: ['./src/rules'],
        rules: {
          'named': 2,
        },
      });
    });
    it("doesn't throw an error on gratuitous, erroneous self-reference", function () {
      expect(() => cli.executeOnFiles(['./tests/files/issue210.js'])).not.to.throw();
    });
  });

  describe('issue #1645', function () {
    let cli;
    beforeEach(function () {
      if (semver.satisfies(eslintPkg.version, '< 6')) {
        this.skip();
      } else {
        cli = new CLIEngine({
          useEslintrc: false,
          configFile: './tests/files/just-json-files/.eslintrc.json',
          rulePaths: ['./src/rules'],
          ignore: false,
        });
      }
    });

    it('throws an error on invalid JSON', () => {
      const invalidJSON = './tests/files/just-json-files/invalid.json';
      const results = cli.executeOnFiles([invalidJSON]);
      expect(results).to.eql({
        results: [
          {
            filePath: path.resolve(invalidJSON),
            messages: [
              {
                column: 2,
                endColumn: 3,
                endLine: 1,
                line: 1,
                message: 'Expected a JSON object, array or literal.',
                nodeType: results.results[0].messages[0].nodeType, // we don't care about this one
                ruleId: 'json/*',
                severity: 2,
                source: results.results[0].messages[0].source, // NewLine-characters might differ depending on git-settings
              },
            ],
            errorCount: 1,
            warningCount: 0,
            fixableErrorCount: 0,
            fixableWarningCount: 0,
            source: results.results[0].source, // NewLine-characters might differ depending on git-settings
          },
        ],
        errorCount: 1,
        warningCount: 0,
        fixableErrorCount: 0,
        fixableWarningCount: 0,
        usedDeprecatedRules: results.usedDeprecatedRules, // we don't care about this one
      });
    });
  });
});
