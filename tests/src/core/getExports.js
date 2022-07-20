import { expect } from  'chai';
import semver from 'semver';
import sinon from 'sinon';
import eslintPkg from 'eslint/package.json';
import typescriptPkg from 'typescript/package.json';
import * as getTsconfig from 'get-tsconfig';
import ExportMap from '../../../src/ExportMap';

import * as fs from 'fs';

import { getFilename } from '../utils';
import { test as testUnambiguous } from 'eslint-module-utils/unambiguous';

describe('ExportMap', function () {
  const fakeContext = Object.assign(
    semver.satisfies(eslintPkg.version, '>= 7.28') ? {
      getFilename() { throw new Error('Should call getPhysicalFilename() instead of getFilename()'); },
      getPhysicalFilename: getFilename,
    } : {
      getFilename,
    },
    {
      settings: {},
      parserPath: 'babel-eslint',
    },
  );

  it('handles ExportAllDeclaration', function () {
    let imports;
    expect(function () {
      imports = ExportMap.get('./export-all', fakeContext);
    }).not.to.throw(Error);

    expect(imports).to.exist;
    expect(imports.has('foo')).to.be.true;

  });

  it('returns a cached copy on subsequent requests', function () {
    expect(ExportMap.get('./named-exports', fakeContext))
      .to.exist.and.equal(ExportMap.get('./named-exports', fakeContext));
  });

  it('does not return a cached copy after modification', (done) => {
    const firstAccess = ExportMap.get('./mutator', fakeContext);
    expect(firstAccess).to.exist;

    // mutate (update modified time)
    const newDate = new Date();
    fs.utimes(getFilename('mutator.js'), newDate, newDate, (error) => {
      expect(error).not.to.exist;
      expect(ExportMap.get('./mutator', fakeContext)).not.to.equal(firstAccess);
      done();
    });
  });

  it('does not return a cached copy with different settings', () => {
    const firstAccess = ExportMap.get('./named-exports', fakeContext);
    expect(firstAccess).to.exist;

    const differentSettings = {
      ...fakeContext,
      parserPath: 'espree',
    };

    expect(ExportMap.get('./named-exports', differentSettings))
      .to.exist.and
      .not.to.equal(firstAccess);
  });

  it('does not throw for a missing file', function () {
    let imports;
    expect(function () {
      imports = ExportMap.get('./does-not-exist', fakeContext);
    }).not.to.throw(Error);

    expect(imports).not.to.exist;

  });

  it('exports explicit names for a missing file in exports', function () {
    let imports;
    expect(function () {
      imports = ExportMap.get('./exports-missing', fakeContext);
    }).not.to.throw(Error);

    expect(imports).to.exist;
    expect(imports.has('bar')).to.be.true;

  });

  it('finds exports for an ES7 module with babel-eslint', function () {
    const path = getFilename('jsx/FooES7.js');
    const contents = fs.readFileSync(path, { encoding: 'utf8' });
    const imports = ExportMap.parse(
      path,
      contents,
      { parserPath: 'babel-eslint', settings: {} },
    );

    expect(imports, 'imports').to.exist;
    expect(imports.errors).to.be.empty;
    expect(imports.get('default'), 'default export').to.exist;
    expect(imports.has('Bar')).to.be.true;
  });

  context('deprecation metadata', function () {

    function jsdocTests(parseContext, lineEnding) {
      context('deprecated imports', function () {
        let imports;
        before('parse file', function () {
          const path = getFilename('deprecated.js');
          const contents = fs.readFileSync(path, { encoding: 'utf8' }).replace(/[\r]\n/g, lineEnding);
          imports = ExportMap.parse(path, contents, parseContext);

          // sanity checks
          expect(imports.errors).to.be.empty;
        });

        it('works with named imports.', function () {
          expect(imports.has('fn')).to.be.true;

          expect(imports.get('fn'))
            .to.have.nested.property('doc.tags[0].title', 'deprecated');
          expect(imports.get('fn'))
            .to.have.nested.property('doc.tags[0].description', 'please use \'x\' instead.');
        });

        it('works with default imports.', function () {
          expect(imports.has('default')).to.be.true;
          const importMeta = imports.get('default');

          expect(importMeta).to.have.nested.property('doc.tags[0].title', 'deprecated');
          expect(importMeta).to.have.nested.property('doc.tags[0].description', 'this is awful, use NotAsBadClass.');
        });

        it('works with variables.', function () {
          expect(imports.has('MY_TERRIBLE_ACTION')).to.be.true;
          const importMeta = imports.get('MY_TERRIBLE_ACTION');

          expect(importMeta).to.have.nested.property(
            'doc.tags[0].title', 'deprecated');
          expect(importMeta).to.have.nested.property(
            'doc.tags[0].description', 'please stop sending/handling this action type.');
        });

        context('multi-line variables', function () {
          it('works for the first one', function () {
            expect(imports.has('CHAIN_A')).to.be.true;
            const importMeta = imports.get('CHAIN_A');

            expect(importMeta).to.have.nested.property(
              'doc.tags[0].title', 'deprecated');
            expect(importMeta).to.have.nested.property(
              'doc.tags[0].description', 'this chain is awful');
          });
          it('works for the second one', function () {
            expect(imports.has('CHAIN_B')).to.be.true;
            const importMeta = imports.get('CHAIN_B');

            expect(importMeta).to.have.nested.property(
              'doc.tags[0].title', 'deprecated');
            expect(importMeta).to.have.nested.property(
              'doc.tags[0].description', 'so awful');
          });
          it('works for the third one, etc.', function () {
            expect(imports.has('CHAIN_C')).to.be.true;
            const importMeta = imports.get('CHAIN_C');

            expect(importMeta).to.have.nested.property(
              'doc.tags[0].title', 'deprecated');
            expect(importMeta).to.have.nested.property(
              'doc.tags[0].description', 'still terrible');
          });
        });
      });

      context('full module', function () {
        let imports;
        before('parse file', function () {
          const path = getFilename('deprecated-file.js');
          const contents = fs.readFileSync(path, { encoding: 'utf8' });
          imports = ExportMap.parse(path, contents, parseContext);

          // sanity checks
          expect(imports.errors).to.be.empty;
        });

        it('has JSDoc metadata', function () {
          expect(imports.doc).to.exist;
        });
      });
    }

    context('default parser', function () {
      jsdocTests({
        parserPath: 'espree',
        parserOptions: {
          ecmaVersion: 2015,
          sourceType: 'module',
          attachComment: true,
        },
        settings: {},
      }, '\n');
      jsdocTests({
        parserPath: 'espree',
        parserOptions: {
          ecmaVersion: 2015,
          sourceType: 'module',
          attachComment: true,
        },
        settings: {},
      }, '\r\n');
    });

    context('babel-eslint', function () {
      jsdocTests({
        parserPath: 'babel-eslint',
        parserOptions: {
          ecmaVersion: 2015,
          sourceType: 'module',
          attachComment: true,
        },
        settings: {},
      }, '\n');
      jsdocTests({
        parserPath: 'babel-eslint',
        parserOptions: {
          ecmaVersion: 2015,
          sourceType: 'module',
          attachComment: true,
        },
        settings: {},
      }, '\r\n');
    });
  });

  context('exported static namespaces', function () {
    const espreeContext = { parserPath: 'espree', parserOptions: { ecmaVersion: 2015, sourceType: 'module' }, settings: {} };
    const babelContext = { parserPath: 'babel-eslint', parserOptions: { ecmaVersion: 2015, sourceType: 'module' }, settings: {} };

    it('works with espree & traditional namespace exports', function () {
      const path = getFilename('deep/a.js');
      const contents = fs.readFileSync(path, { encoding: 'utf8' });
      const a = ExportMap.parse(path, contents, espreeContext);
      expect(a.errors).to.be.empty;
      expect(a.get('b').namespace).to.exist;
      expect(a.get('b').namespace.has('c')).to.be.true;
    });

    it('captures namespace exported as default', function () {
      const path = getFilename('deep/default.js');
      const contents = fs.readFileSync(path, { encoding: 'utf8' });
      const def = ExportMap.parse(path, contents, espreeContext);
      expect(def.errors).to.be.empty;
      expect(def.get('default').namespace).to.exist;
      expect(def.get('default').namespace.has('c')).to.be.true;
    });

    it('works with babel-eslint & ES7 namespace exports', function () {
      const path = getFilename('deep-es7/a.js');
      const contents = fs.readFileSync(path, { encoding: 'utf8' });
      const a = ExportMap.parse(path, contents, babelContext);
      expect(a.errors).to.be.empty;
      expect(a.get('b').namespace).to.exist;
      expect(a.get('b').namespace.has('c')).to.be.true;
    });
  });

  context('deep namespace caching', function () {
    const espreeContext = { parserPath: 'espree', parserOptions: { ecmaVersion: 2015, sourceType: 'module' }, settings: {} };
    let a;
    before('sanity check and prime cache', function (done) {
      // first version
      fs.writeFileSync(getFilename('deep/cache-2.js'),
        fs.readFileSync(getFilename('deep/cache-2a.js')));

      const path = getFilename('deep/cache-1.js');
      const contents = fs.readFileSync(path, { encoding: 'utf8' });
      a = ExportMap.parse(path, contents, espreeContext);
      expect(a.errors).to.be.empty;

      expect(a.get('b').namespace).to.exist;
      expect(a.get('b').namespace.has('c')).to.be.true;

      // wait ~1s, cache check is 1s resolution
      setTimeout(function reup() {
        fs.unlinkSync(getFilename('deep/cache-2.js'));
        // swap in a new file and touch it
        fs.writeFileSync(getFilename('deep/cache-2.js'),
          fs.readFileSync(getFilename('deep/cache-2b.js')));
        done();
      }, 1100);
    });

    it('works', function () {
      expect(a.get('b').namespace.has('c')).to.be.false;
    });

    after('remove test file', (done) => fs.unlink(getFilename('deep/cache-2.js'), done));
  });

  context('Map API', function () {
    context('#size', function () {

      it('counts the names', () => expect(ExportMap.get('./named-exports', fakeContext))
        .to.have.property('size', 12));

      it('includes exported namespace size', () => expect(ExportMap.get('./export-all', fakeContext))
        .to.have.property('size', 1));

    });
  });

  context('issue #210: self-reference', function () {
    it(`doesn't crash`, function () {
      expect(() => ExportMap.get('./narcissist', fakeContext)).not.to.throw(Error);
    });
    it(`'has' circular reference`, function () {
      expect(ExportMap.get('./narcissist', fakeContext))
        .to.exist.and.satisfy((m) => m.has('soGreat'));
    });
    it(`can 'get' circular reference`, function () {
      expect(ExportMap.get('./narcissist', fakeContext))
        .to.exist.and.satisfy((m) => m.get('soGreat') != null);
    });
  });

  context('issue #478: never parse non-whitelist extensions', function () {
    const context = {
      ...fakeContext,
      settings: { 'import/extensions': ['.js'] },
    };

    let imports;
    before('load imports', function () {
      imports = ExportMap.get('./typescript.ts', context);
    });

    it('returns nothing for a TypeScript file', function () {
      expect(imports).not.to.exist;
    });

  });

  context('alternate parsers', function () {
    const configs = [
      // ['string form', { 'typescript-eslint-parser': '.ts' }],
    ];

    if (semver.satisfies(eslintPkg.version, '>5')) {
      configs.push(['array form', { '@typescript-eslint/parser': ['.ts', '.tsx'] }]);
    }

    if (semver.satisfies(eslintPkg.version, '<6') && semver.satisfies(typescriptPkg.version, '<4')) {
      configs.push(['array form', { 'typescript-eslint-parser': ['.ts', '.tsx'] }]);
    }

    configs.forEach(([description, parserConfig]) => {

      describe(description, function () {
        const context = {
          ...fakeContext,
          settings: {
            'import/extensions': ['.js'],
            'import/parsers': parserConfig,
          },
        };

        let imports;
        before('load imports', function () {
          this.timeout(20e3);  // takes a long time :shrug:
          sinon.spy(getTsconfig, 'getTsconfig');
          imports = ExportMap.get('./typescript.ts', context);
        });
        after('clear spies', function () {
          getTsconfig.getTsconfig.restore();
        });

        it('returns something for a TypeScript file', function () {
          expect(imports).to.exist;
        });

        it('has no parse errors', function () {
          expect(imports).property('errors').to.be.empty;
        });

        it('has exported function', function () {
          expect(imports.has('getFoo')).to.be.true;
        });

        it('has exported typedef', function () {
          expect(imports.has('MyType')).to.be.true;
        });

        it('has exported enum', function () {
          expect(imports.has('MyEnum')).to.be.true;
        });

        it('has exported interface', function () {
          expect(imports.has('Foo')).to.be.true;
        });

        it('has exported abstract class', function () {
          expect(imports.has('Bar')).to.be.true;
        });

        it('should cache tsconfig until tsconfigRootDir parser option changes', function () {
          const customContext = {
            ...context,
            parserOptions: {
              tsconfigRootDir: null,
            },
          };
          expect(getTsconfig.getTsconfig.callCount).to.equal(0);
          ExportMap.parse('./baz.ts', 'export const baz = 5', customContext);
          expect(getTsconfig.getTsconfig.callCount).to.equal(1);
          ExportMap.parse('./baz.ts', 'export const baz = 5', customContext);
          expect(getTsconfig.getTsconfig.callCount).to.equal(1);

          const differentContext = {
            ...context,
            parserOptions: {
              tsconfigRootDir: process.cwd(),
            },
          };

          ExportMap.parse('./baz.ts', 'export const baz = 5', differentContext);
          expect(getTsconfig.getTsconfig.callCount).to.equal(2);
        });

        it('should cache after parsing for an ambiguous module', function () {
          const source = './typescript-declare-module.ts';
          const parseSpy = sinon.spy(ExportMap, 'parse');

          expect(ExportMap.get(source, context)).to.be.null;

          ExportMap.get(source, context);

          expect(parseSpy.callCount).to.equal(1);

          parseSpy.restore();
        });
      });
    });
  });

  // todo: move to utils
  describe('unambiguous regex', function () {
    const testFiles = [
      ['deep/b.js', true],
      ['bar.js', true],
      ['deep-es7/b.js', true],
      ['common.js', false],
    ];

    for (const [testFile, expectedRegexResult] of testFiles) {
      it(`works for ${testFile} (${expectedRegexResult})`, function () {
        const content = fs.readFileSync(`./tests/files/${testFile}`, 'utf8');
        expect(testUnambiguous(content)).to.equal(expectedRegexResult);
      });
    }
  });
});
