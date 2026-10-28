import sinon from 'sinon';
import { expect } from 'chai';
import StronglyConnectedComponentsBuilder from '../../src/scc';
import ExportMapBuilder from '../../src/exportMap/builder';

function exportMapFixtureBuilder(path, imports, isOnlyImportingTypes = false) {
  return {
    path,
    imports: new Map(imports.map((imp) => [imp.path, { getter: () => imp, declarations: [{ isOnlyImportingTypes }] }])),
  };
}

describe('Strongly Connected Components Builder', () => {
  afterEach(() => ExportMapBuilder.for.restore());
  afterEach(() => StronglyConnectedComponentsBuilder.clearCache());

  describe('When getting an SCC', () => {
    const source = '';
    const context = {
      settings: {},
      parserOptions: {},
      parserPath: '',
    };

    describe('Given two files', () => {
      describe('When they don\'t value-cycle', () => {
        it('Should return foreign SCCs', () => {
          sinon.stub(ExportMapBuilder, 'for').returns(
            exportMapFixtureBuilder('foo.js', [exportMapFixtureBuilder('bar.js', [])]),
          );
          const actual = StronglyConnectedComponentsBuilder.for(source, context);
          expect(actual).to.deep.equal({ 'foo.js': 1, 'bar.js': 0 });
        });
      });

      describe('When they do value-cycle', () => {
        it('Should return same SCC', () => {
          sinon.stub(ExportMapBuilder, 'for').returns(
            exportMapFixtureBuilder('foo.js', [
              exportMapFixtureBuilder('bar.js', [
                exportMapFixtureBuilder('foo.js', [exportMapFixtureBuilder('bar.js', [])]),
              ]),
            ]),
          );
          const actual = StronglyConnectedComponentsBuilder.for(source, context);
          expect(actual).to.deep.equal({ 'foo.js': 0, 'bar.js': 0 });
        });
      });

      describe('When they type-cycle', () => {
        it('Should return foreign SCCs', () => {
          sinon.stub(ExportMapBuilder, 'for').returns(
            exportMapFixtureBuilder('foo.js', [
              exportMapFixtureBuilder('bar.js', [
                exportMapFixtureBuilder('foo.js', []),
              ], true),
            ]),
          );
          const actual = StronglyConnectedComponentsBuilder.for(source, context);
          expect(actual).to.deep.equal({ 'foo.js': 1, 'bar.js': 0 });
        });
      });
    });

    describe('Given three files', () => {
      describe('When they form a line', () => {
        describe('When A -> B -> C', () => {
          it('Should return foreign SCCs', () => {
            sinon.stub(ExportMapBuilder, 'for').returns(
              exportMapFixtureBuilder('foo.js', [
                exportMapFixtureBuilder('bar.js', [
                  exportMapFixtureBuilder('buzz.js', []),
                ]),
              ]),
            );
            const actual = StronglyConnectedComponentsBuilder.for(source, context);
            expect(actual).to.deep.equal({ 'foo.js': 2, 'bar.js': 1, 'buzz.js': 0 });
          });
        });

        describe('When A -> B <-> C', () => {
          it('Should return 2 SCCs, A on its own', () => {
            sinon.stub(ExportMapBuilder, 'for').returns(
              exportMapFixtureBuilder('foo.js', [
                exportMapFixtureBuilder('bar.js', [
                  exportMapFixtureBuilder('buzz.js', [
                    exportMapFixtureBuilder('bar.js', []),
                  ]),
                ]),
              ]),
            );
            const actual = StronglyConnectedComponentsBuilder.for(source, context);
            expect(actual).to.deep.equal({ 'foo.js': 1, 'bar.js': 0, 'buzz.js': 0 });
          });
        });

        describe('When A <-> B -> C', () => {
          it('Should return 2 SCCs, C on its own', () => {
            sinon.stub(ExportMapBuilder, 'for').returns(
              exportMapFixtureBuilder('foo.js', [
                exportMapFixtureBuilder('bar.js', [
                  exportMapFixtureBuilder('buzz.js', []),
                  exportMapFixtureBuilder('foo.js', []),
                ]),
              ]),
            );
            const actual = StronglyConnectedComponentsBuilder.for(source, context);
            expect(actual).to.deep.equal({ 'foo.js': 1, 'bar.js': 1, 'buzz.js': 0 });
          });
        });

        describe('When A <-> B <-> C', () => {
          it('Should return same SCC', () => {
            sinon.stub(ExportMapBuilder, 'for').returns(
              exportMapFixtureBuilder('foo.js', [
                exportMapFixtureBuilder('bar.js', [
                  exportMapFixtureBuilder('foo.js', []),
                  exportMapFixtureBuilder('buzz.js', [
                    exportMapFixtureBuilder('bar.js', []),
                  ]),
                ]),
              ]),
            );
            const actual = StronglyConnectedComponentsBuilder.for(source, context);
            expect(actual).to.deep.equal({ 'foo.js': 0, 'bar.js': 0, 'buzz.js': 0 });
          });
        });
      });

      describe('When they form a loop', () => {
        it('Should return same SCC', () => {
          sinon.stub(ExportMapBuilder, 'for').returns(
            exportMapFixtureBuilder('foo.js', [
              exportMapFixtureBuilder('bar.js', [
                exportMapFixtureBuilder('buzz.js', [
                  exportMapFixtureBuilder('foo.js', []),
                ]),
              ]),
            ]),
          );
          const actual = StronglyConnectedComponentsBuilder.for(source, context);
          expect(actual).to.deep.equal({ 'foo.js': 0, 'bar.js': 0, 'buzz.js': 0 });
        });
      });

      describe('When they form a Y', () => {
        it('Should return 3 distinct SCCs', () => {
          sinon.stub(ExportMapBuilder, 'for').returns(
            exportMapFixtureBuilder('foo.js', [
              exportMapFixtureBuilder('bar.js', []),
              exportMapFixtureBuilder('buzz.js', []),
            ]),
          );
          const actual = StronglyConnectedComponentsBuilder.for(source, context);
          expect(actual).to.deep.equal({ 'foo.js': 2, 'bar.js': 0, 'buzz.js': 1 });
        });
      });

      describe('When they form a Mercedes', () => {
        it('Should return 1 SCC', () => {
          sinon.stub(ExportMapBuilder, 'for').returns(
            exportMapFixtureBuilder('foo.js', [
              exportMapFixtureBuilder('bar.js', [
                exportMapFixtureBuilder('foo.js', []),
                exportMapFixtureBuilder('buzz.js', []),
              ]),
              exportMapFixtureBuilder('buzz.js', [
                exportMapFixtureBuilder('foo.js', []),
                exportMapFixtureBuilder('bar.js', []),
              ]),
            ]),
          );
          const actual = StronglyConnectedComponentsBuilder.for(source, context);
          expect(actual).to.deep.equal({ 'foo.js': 0, 'bar.js': 0, 'buzz.js': 0 });
        });
      });
    });

    describe('Given several linted files', () => {
      let expansions;
      let files;

      function linkFiles(from, to) {
        from.imports.set(to.path, {
          getter() {
            expansions[to.path] = (expansions[to.path] || 0) + 1;
            return to;
          },
          declarations: [{ isOnlyImportingTypes: false }],
        });
      }

      function file(path, imports = []) {
        const exportMap = { path, imports: new Map() };
        files[path] = exportMap;
        imports.forEach((imported) => linkFiles(exportMap, imported));
        return exportMap;
      }

      function contextFor(path, overrides) {
        return { ...context, path, ...overrides };
      }

      beforeEach(() => {
        expansions = {};
        files = {};
      });

      describe('When files that cannot reach each other share a dependency cycle', () => {
        it('Should share one graph, and expand each dependency once', () => {
          // a -> c, b -> c, c <-> d
          const d = file('d.js');
          const c = file('c.js', [d]);
          linkFiles(d, c);
          const a = file('a.js', [c]);
          const b = file('b.js', [c]);
          sinon.stub(ExportMapBuilder, 'for').callsFake((ctx) => files[ctx.path]);

          const fromA = StronglyConnectedComponentsBuilder.for(contextFor(a.path));
          const fromB = StronglyConnectedComponentsBuilder.for(contextFor(b.path));

          expect(fromB).to.equal(fromA);
          expect(fromB['c.js']).to.equal(fromB['d.js']);
          expect(new Set([fromB['a.js'], fromB['b.js'], fromB['c.js']]).size).to.equal(3);
          expect(expansions['d.js']).to.equal(1);
        });
      });

      describe('When a file was already reached from an earlier linted file', () => {
        it('Should not build its export map again', () => {
          // a -> b
          file('b.js');
          file('a.js', [files['b.js']]);
          sinon.stub(ExportMapBuilder, 'for').callsFake((ctx) => files[ctx.path]);

          const first = StronglyConnectedComponentsBuilder.for(contextFor('a.js'));
          const second = StronglyConnectedComponentsBuilder.for(contextFor('b.js'));

          expect(second).to.equal(first);
          expect(ExportMapBuilder.for.callCount).to.equal(1);
        });
      });

      describe('When a later file forms a cycle next to files that already have an SCC', () => {
        it('Should only put the new cycle together, and keep the earlier files apart', () => {
          // a -> c, then b <-> d with d -> c
          const c = file('c.js');
          file('a.js', [c]);
          const d = file('d.js', [c]);
          const b = file('b.js', [d]);
          linkFiles(d, b);
          sinon.stub(ExportMapBuilder, 'for').callsFake((ctx) => files[ctx.path]);

          StronglyConnectedComponentsBuilder.for(contextFor('a.js'));
          const actual = StronglyConnectedComponentsBuilder.for(contextFor('b.js'));

          expect(actual['b.js']).to.equal(actual['d.js']);
          expect(new Set([actual['a.js'], actual['b.js'], actual['c.js']]).size).to.equal(3);
        });
      });

      describe('When a later file is a cycle with a file only reached through an earlier one', () => {
        it('Should keep SCC ids unique across linted files', () => {
          // a -> c, b -> e, e <-> f: the second file adds new SCCs, and their ids must not reuse the first file's
          file('c.js');
          file('a.js', [files['c.js']]);
          const f = file('f.js');
          const e = file('e.js', [f]);
          linkFiles(f, e);
          file('b.js', [e]);
          sinon.stub(ExportMapBuilder, 'for').callsFake((ctx) => files[ctx.path]);

          StronglyConnectedComponentsBuilder.for(contextFor('a.js'));
          const actual = StronglyConnectedComponentsBuilder.for(contextFor('b.js'));

          expect(actual['e.js']).to.equal(actual['f.js']);
          expect(new Set(['a.js', 'b.js', 'c.js', 'e.js'].map((name) => actual[name])).size).to.equal(4);
        });
      });

      describe('When the settings differ', () => {
        it('Should keep a separate graph for each', () => {
          file('b.js');
          file('a.js', [files['b.js']]);
          sinon.stub(ExportMapBuilder, 'for').callsFake((ctx) => files[ctx.path]);

          const first = StronglyConnectedComponentsBuilder.for(contextFor('a.js', { parserPath: 'one' }));
          const second = StronglyConnectedComponentsBuilder.for(contextFor('a.js', { parserPath: 'two' }));

          expect(second).not.to.equal(first);
          expect(second).to.deep.equal(first);
        });
      });
    });
  });
});
