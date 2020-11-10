# Change Log

All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).
This change log adheres to standards from [Keep a CHANGELOG](http://keepachangelog.com).

## [Unreleased]
### Added
- [`first`]/TypeScript: Add support for `import =` expressions ([#1917], thanks [@ExE-Boss])

### Fixed
- [`export`]/TypeScript: properly detect export specifiers as children of a TS module block ([#1889], thanks [@andreubotella])

## [2.22.1] - 2020-09-27
### Fixed
- [`default`]/TypeScript: avoid crash on `export =` with a MemberExpression ([#1841], thanks [@ljharb])
- [`extensions`]/importType: Fix @/abc being treated as scoped module ([#1854], thanks [@3nuc])
- allow using rest operator in named export ([#1878], thanks [@foray1010])
- [`dynamic-import-chunkname`]: allow single quotes to match Webpack support ([#1848], thanks [@straub])

### Changed
- [`export`]: add tests for a name collision with `export * from` ([#1704], thanks @tomprats)

## [2.22.0] - 2020-06-26
### Added
- [`no-unused-modules`]: consider exported TypeScript interfaces, types and enums ([#1819], thanks [@nicolashenry])
- [`no-cycle`]: allow `maxDepth` option to be `"∞"` (thanks [@ljharb])

### Fixed
- [`order`]/TypeScript: properly support `import = object` expressions ([#1823], thanks [@manuth])
- [`no-extraneous-dependencies`]/TypeScript: do not error when importing type from dev dependencies ([#1820], thanks [@fernandopasik])
- [`default`]: avoid crash with `export =` ([#1822], thanks [@AndrewLeedham])
- [`order`]/[`newline-after-import`]: ignore TypeScript's "export import object" ([#1830], thanks [@be5invis])
- [`dynamic-import-chunkname`]/TypeScript: supports `@typescript-eslint/parser` ([#1833], thanks [@noelebrun])
- [`order`]/TypeScript: ignore ordering of object imports ([#1831], thanks [@manuth])
- [`namespace`]: do not report on shadowed import names ([#518], thanks [@ljharb])
- [`export`]: avoid warning on `export * as` non-conflicts ([#1834], thanks [@ljharb])

### Changed
- [`no-extraneous-dependencies`]: add tests for importing types ([#1824], thanks [@taye])
- [docs] [`no-default-export`]: Fix docs url ([#1836], thanks [@beatrizrezener])
- [docs] [`imports-first`]: deprecation info and link to `first` docs ([#1835], thanks [@beatrizrezener])

## [2.21.2] - 2020-06-09
### Fixed
- [`order`]: avoid a crash on TypeScript’s `export import` syntax ([#1808], thanks [@ljharb])
- [`newline-after-import`]: consider TypeScript `import =` syntax' ([#1811], thanks [@ljharb])
- [`no-internal-modules`]: avoid a crash on a named export declaration ([#1814], thanks [@ljharb])

## [2.21.1] - 2020-06-07
### Fixed
- TypeScript: [`import/named`]: avoid requiring `typescript` when not using TS ([#1805], thanks [@ljharb])

## [2.21.0] - 2020-06-07
### Added
- [`import/default`]: support default export in TSExportAssignment ([#1528], thanks [@joaovieira])
- [`no-cycle`]: add `ignoreExternal` option ([#1681], thanks [@sveyret])
- [`order`]: Add support for TypeScript's "import equals"-expressions ([#1785], thanks [@manuth])
- [`import/default`]: support default export in TSExportAssignment ([#1689], thanks [@Maxim-Mazurok])
- [`no-restricted-paths`]: add custom message support ([#1802], thanks [@malykhinvi])

### Fixed
- [`group-exports`]: Flow type export awareness ([#1702], thanks [@ernestostifano])
- [`order`]: Recognize pathGroup config for first group ([#1719], [#1724], thanks [@forivall], [@xpl])
- [`no-unused-modules`]: Fix re-export not counting as usage when used in combination with import ([#1722], thanks [@Ephem])
- [`no-duplicates`]: Handle TS import type ([#1676], thanks [@kmui2])
- [`newline-after-import`]: recognize decorators ([#1139], thanks [@atos1990])
- [`no-unused-modules`]: Revert "[flow] `no-unused-modules`: add flow type support" ([#1770], thanks [@Hypnosphi])
- TypeScript: Add nested namespace handling ([#1763], thanks [@julien1619])
- [`namespace`]/`ExportMap`: Fix interface declarations for TypeScript ([#1764], thanks [@julien1619])
- [`no-unused-modules`]: avoid order-dependence ([#1744], thanks [@darkartur])
- [`no-internal-modules`]: also check `export from` syntax ([#1691], thanks [@adjerbetian])
- TypeScript: [`export`]: avoid a crash with `export =` ([#1801], thanks [@ljharb])

### Changed
- [Refactor] `no-extraneous-dependencies`: use moduleVisitor ([#1735], thanks [@adamborowski])
- TypeScript config: Disable [`named`][] ([#1726], thanks [@astorije])
- [readme] Remove duplicate no-unused-modules from docs ([#1690], thanks [@arvigeus])
- [Docs] `order`: fix bad inline config ([#1788], thanks [@nickofthyme])
- [Tests] Add fix for Windows Subsystem for Linux ([#1786], thanks [@manuth])
- [Docs] `no-unused-rules`: Fix docs for unused exports ([#1776], thanks [@barbogast])
- [eslint] bump minimum v7 version to v7.2.0

## [2.20.2] - 2020-03-28
### Fixed
- [`order`]: fix `isExternalModule` detect on windows ([#1651], thanks [@fisker])
- [`order`]: recognize ".." as a "parent" path ([#1658], thanks [@golopot])
- [`no-duplicates`]: fix fixer on cases with default import ([#1666], thanks [@golopot])
- [`no-unused-modules`]: Handle `export { default } from` syntax ([#1631], thanks [@richardxia])
- [`first`]: Add a way to disable `absolute-first` explicitly ([#1664], thanks [@TheCrueltySage])
- [Docs] `no-webpack-loader-syntax`: Updates webpack URLs ([#1751], thanks [@MikeyBeLike])

## [2.20.1] - 2020-02-01
### Fixed
- [`export`]: Handle function overloading in `*.d.ts` ([#1619], thanks [@IvanGoncharov])
- [`no-absolute-path`]: fix a crash with invalid import syntax ([#1616], thanks [@ljharb])
- [`import/external-module-folders` setting] now correctly works with directories containing modules symlinked from `node_modules` ([#1605], thanks [@skozin])
- [`extensions`]: for invalid code where `name` does not exist, do not crash ([#1613], thanks [@ljharb])
- [`extensions`]: Fix scope regex ([#1611], thanks [@yordis])
- [`no-duplicates`]: allow duplicate imports if one is a namespace and the other not ([#1612], thanks [@sveyret])
- Add some missing rule meta schemas and types ([#1620], thanks [@bmish])
- [`named`]: for importing from a module which re-exports named exports from a `node_modules` module ([#1569], [#1447], thanks [@redbugz], [@kentcdodds])
- [`order`]: Fix alphabetize for mixed requires and imports ([#5625], thanks [@wschurman])

### Changed
- [`import/external-module-folders` setting] behavior is more strict now: it will only match complete path segments ([#1605], thanks [@skozin])
- [meta] fix "files" field to include/exclude the proper files ([#1635], thanks [@ljharb])
- [Tests] `order`: Add TS import type tests ([#1736], thanks [@kmui2])

## [2.20.0] - 2020-01-10
### Added
- [`order`]: added `caseInsensitive` as an additional option to `alphabetize` ([#1586], thanks [@dbrewer5])
- [`no-restricted-paths`]: New `except` option per `zone`, allowing exceptions to be defined for a restricted zone ([#1238], thanks [@rsolomon])
- [`order`]: add option pathGroupsExcludedImportTypes to allow ordering of external import types ([#1565], thanks [@Mairu])

### Fixed
- [`no-unused-modules`]: fix usage of `import/extensions` settings ([#1560], thanks [@stekycz])
- [`extensions`]: ignore non-main modules ([#1563], thanks [@saschanaz])
- TypeScript config: lookup for external modules in @types folder ([#1526], thanks [@joaovieira])
- [`no-extraneous-dependencies`]: ensure `node.source` is truthy ([#1589], thanks [@ljharb])
- [`extensions`]: Ignore query strings when checking for extensions ([#1572], thanks [@pcorpet])

### Docs
- [`extensions`]: improve `ignorePackages` docs ([#1248], thanks [@ivo-stefchev])

## [2.19.1] - 2019-12-08
### Fixed
- [`no-extraneous-dependencies`]: ensure `node.source` exists

## [2.19.0] - 2019-12-08
### Added
- [`internal-regex` setting]: regex pattern for marking packages "internal"  ([#1491], thanks [@Librazy])
- [`group-exports`]: make aggregate module exports valid ([#1472], thanks [@atikenny])
- [`no-namespace`]: Make rule fixable ([#1401], thanks [@TrevorBurnham])
- support `parseForESLint` from custom parser ([#1435], thanks [@JounQin])
- [`no-extraneous-dependencies`]: Implement support for [bundledDependencies](https://npm.github.io/using-pkgs-docs/package-json/types/bundleddependencies.html) ([#1436], thanks [@schmidsi]))
- [`no-unused-modules`]: add flow type support ([#1542], thanks [@rfermann])
- [`order`]: Adds support for pathGroups to allow ordering by defined patterns ([#795], [#1386], thanks [@Mairu])
- [`no-duplicates`]: Add `considerQueryString` option : allow duplicate imports with different query strings ([#1107], thanks [@pcorpet]).
- [`order`]: Add support for alphabetical sorting of import paths within import groups ([#1360], [#1105], [#629], thanks [@duncanbeevers], [@stropho], [@luczsoma], [@randallreedjr])
- [`no-commonjs`]: add `allowConditionalRequire` option ([#1439], thanks [@Pessimistress])

### Fixed
- [`default`]: make error message less confusing ([#1470], thanks [@golopot])
- Improve performance of `ExportMap.for` by only loading paths when necessary. ([#1519], thanks [@brendo])
- Support export of a merged TypeScript namespace declaration ([#1495], thanks [@benmunro])
- [`order`]: fix autofix to not move imports across fn calls ([#1253], thanks [@tihonove])
- [`prefer-default-export`]: fix false positive with type export ([#1506], thanks [@golopot])
- [`extensions`]: Fix `ignorePackages` to produce errors ([#1521], thanks [@saschanaz])
- [`no-unused-modules`]: fix crash due to `export *` ([#1496], thanks [@Taranys])
- [`no-cycle`]: should not warn for Flow imports ([#1494], thanks [@maxmalov])
- [`order`]: fix `@someModule` considered as `unknown` instead of `internal` ([#1493], thanks [@aamulumi])
- [`no-extraneous-dependencies`]: Check `export from` ([#1049], thanks [@marcusdarmstrong])

### Docs
- [`no-useless-path-segments`]: add docs for option `commonjs` ([#1507], thanks [@golopot])

### Changed
- [`no-unused-modules`]/`eslint-module-utils`: Avoid superfluous calls and code ([#1551], thanks [@brettz9])

## [2.18.2] - 2019-07-19
### Fixed
- Skip warning on type interfaces ([#1425], thanks [@lencioni])

## [2.18.1] - 2019-07-18
### Fixed
- Improve parse perf when using `@typescript-eslint/parser` ([#1409], thanks [@bradzacher])
- [`prefer-default-export`]: don't warn on TypeAlias & TSTypeAliasDeclaration ([#1377], thanks [@sharmilajesupaul])
- [`no-unused-modules`]: Exclude package "main"/"bin"/"browser" entry points ([#1404], thanks [@rfermann])
- [`export`]: false positive for TypeScript overloads ([#1412], thanks [@golopot])

### Refactors
- [`no-extraneous-dependencies`], `importType`: remove lodash ([#1419], thanks [@ljharb])

## [2.18.0] - 2019-06-24
### Added
- Support eslint v6 ([#1393], thanks [@sheepsteak])
- [`order`]: Adds support for correctly sorting unknown types into a single group ([#1375], thanks [@swernerx])
- [`order`]: add fixer for destructuring commonjs import ([#1372], thanks [@golopot])
- TypeScript config: add TS def extensions + defer to TS over JS ([#1366], thanks [@benmosher])

### Fixed
- [`no-unused-modules`]: handle ClassDeclaration ([#1371], thanks [@golopot])

### Docs
- [`no-cycle`]: split code examples so file separation is obvious ([#1370], thanks [@alex-page])
- [`no-named-as-default-member`]: update broken link ([#1389], thanks [@fooloomanzoo])

## [2.17.3] - 2019-05-23
### Fixed
- [`no-common-js`]: Also throw an error when assigning ([#1354], thanks [@charlessuh])
- [`no-unused-modules`]: don't crash when lint file outside src-folder ([#1347], thanks [@rfermann])
- [`no-unused-modules`]: make `import { name as otherName }` work ([#1340], [#1342], thanks [@rfermann])
- [`no-unused-modules`]: make appveyor tests passing ([#1333], thanks [@rfermann])
- [`named`]: ignore Flow `typeof` imports and `type` exports ([#1345], thanks [@loganfsmyth])
- [refactor] fix eslint 6 compat by fixing imports (thank [@ljharb])
- Improve support for TypeScript declare structures ([#1356], thanks [@christophercurrie])

### Docs
- add missing `no-unused-modules` in README ([#1358], thanks [@golopot])
- [`no-unused-modules`]: Indicates usage, plugin defaults to no-op, and add description to main README.md ([#1352], thanks [@johndevedu])
- Document `env` option for `eslint-import-resolver-webpack` ([#1363], thanks [@kgregory])

## [2.17.2] - 2019-04-16
### Fixed
- [`no-unused-modules`]: avoid crash when using `ignoreExports`-option ([#1331], [#1323], thanks [@rfermann])
- [`no-unused-modules`]: make sure that rule with no options will not fail ([#1330], [#1334], thanks [@kiwka])

## [2.17.1] - 2019-04-13
### Fixed
- require v2.4 of `eslint-module-utils` ([#1322])

## [2.17.0] - 2019-04-13
### Added
- [`no-useless-path-segments`]: Add `noUselessIndex` option ([#1290], thanks [@timkraut])
- [`no-duplicates`]: Add autofix ([#1312], thanks [@lydell])
- Add [`no-unused-modules`] rule ([#1142], thanks [@rfermann])
- support export type named exports from TypeScript ([#1304], thanks [@bradennapier] and [@schmod])

### Fixed
- [`order`]: Fix interpreting some external modules being interpreted as internal modules ([#793], [#794] thanks [@ephys])
- allow aliases that start with @ to be "internal" ([#1293], [#1294], thanks [@jeffshaver])
- aliased internal modules that look like core modules ([#1297], thanks [@echenley])
- [`namespace`]: add check for null ExportMap ([#1235], [#1144], thanks [@ljqx])
- [ExportMap] fix condition for checking if block comment ([#1234], [#1233], thanks [@ljqx])
- Fix overwriting of dynamic import() CallExpression ([`no-cycle`], [`no-relative-parent-import`], [`no-unresolved`], [`no-useless-path-segments`]) ([#1218], [#1166], [#1035], thanks [@vikr01])
- [`export`]: false positives for TypeScript type + value export ([#1319], thanks [@bradzacher])
- [`export`]: Support TypeScript namespaces ([#1320], [#1300], thanks [@bradzacher])

### Docs
- Update readme for TypeScript ([#1256], [#1277], thanks [@kirill-konshin])
- make rule names consistent ([#1112], thanks [@feychenie])

### Tests
- fix broken tests on master ([#1295], thanks [@jeffshaver] and [@ljharb])
- [`no-commonjs`]: add tests that show corner cases ([#1308], thanks [@TakeScoop])

## [2.16.0] - 2019-01-29
### Added
- `typescript` config ([#1257], thanks [@kirill-konshin])

### Fixed
- Memory leak of `SourceCode` objects for all parsed dependencies, resolved. (issue [#1266], thanks [@asapach] and [@sergei-startsev] for digging in)

## [2.15.0] - 2019-01-22
### Added
- new rule: [`no-named-export`] ([#1157], thanks [@fsmaia])

### Fixed
- [`no-extraneous-dependencies`]: `packageDir` option with array value was clobbering package deps instead of merging them ([#1175]/[#1176], thanks [@aravindet] & [@pzhine])
- [`dynamic-import-chunkname`]: Add proper webpack comment parsing ([#1163], thanks [@st-sloth])
- [`named`]: fix destructuring assignment ([#1232], thanks [@ljqx])

## [2.14.0] - 2018-08-13
### Added
- [`no-useless-path-segments`]: add commonJS (CJS) support ([#1128], thanks [@1pete])
- [`namespace`]: add JSX check ([#1151], thanks [@jf248])

### Fixed
- [`no-cycle`]: ignore Flow imports ([#1126], thanks [@gajus])
- fix Flow type imports ([#1106], thanks [@syymza])
- [`no-relative-parent-imports`]: resolve paths ([#1135], thanks [@chrislloyd])
- [`order`]: fix autofixer when using typescript-eslint-parser ([#1137], thanks [@justinanastos])
- repeat fix from [#797] for [#717], in another place (thanks [@ljharb])

### Refactors
- add explicit support for RestElement alongside ExperimentalRestProperty (thanks [@ljharb])

## [2.13.0] - 2018-06-24
### Added
- Add ESLint 5 support ([#1122], thanks [@ai] and [@ljharb])
- Add [`no-relative-parent-imports`] rule: disallow relative imports from parent directories ([#1093], thanks [@chrislloyd])

### Fixed
- `namespace` rule: ensure it works in eslint 5/ecmaVersion 2018 (thanks [@ljharb])

## [2.12.0] - 2018-05-17
### Added
- Ignore type imports for [`named`] rule ([#931], thanks [@mattijsbliek])
- Add documentation for [`no-useless-path-segments`] rule ([#1068], thanks [@manovotny])
- `packageDir` option for [`no-extraneous-dependencies`] can be array-valued ([#1085], thanks [@hulkish])

## [2.11.0] - 2018-04-09
### Added
- Fixer for [`first`] ([#1046], thanks [@fengkfengk])
- `allow-require` option for [`no-commonjs`] rule ([#880], thanks [@futpib])

### Fixed
- memory/CPU regression where ASTs were held in memory ([#1058], thanks [@klimashkin]/[@lukeapage])

## [2.10.0] - 2018-03-29
### Added
- Autofixer for [`order`] rule ([#908], thanks [@tihonove])
- Add [`no-cycle`] rule: reports import cycles.

## [2.9.0] - 2018-02-21
### Added
- Add [`group-exports`] rule: style-guide rule to report use of multiple named exports ([#721], thanks [@robertrossmann])
- Add [`no-self-import`] rule: forbids a module from importing itself. ([#727], [#449], [#447], thanks [@giodamelio]).
- Add [`no-default-export`] rule ([#889], thanks [@isiahmeadows])
- Add [`no-useless-path-segments`] rule ([#912], thanks [@graingert] and [@danny-andrews])
- ... and more! check the commits for v[2.9.0]

## [2.8.0] - 2017-10-18
### Added
- [`exports-last`] rule ([#620] + [#632], thanks [@k15a])

### Changed
- Case-sensitivity checking ignores working directory and ancestors. ([#720] + [#858], thanks [@laysent])

### Fixed
- support scoped modules containing hyphens ([#744], thanks [@rosswarren])
- core-modules now resolves files inside declared modules ([#886] / [#891], thanks [@mplewis])
- TypeError for missing AST fields from TypeScript ([#842] / [#944], thanks [@alexgorbatchev])

## [2.7.0] - 2017-07-06
### Changed
- [`no-absolute-path`] picks up speed boost, optional AMD support ([#843], thanks [@jseminck])

## [2.6.1] - 2017-06-29
### Fixed
- update bundled node resolver dependency to latest version

## [2.6.0] - 2017-06-23
### Changed
- update tests / peerDeps for ESLint 4.0 compatibility ([#871], thanks [@mastilver])
- [`memo-parser`] updated to require `filePath` on parser options as it melts
  down if it's not there, now that this plugin always provides it. (see [#863])

## [2.5.0] - 2017-06-22

Re-releasing v[2.4.0] after discovering that the memory leak is isolated to the [`memo-parser`],
which is more or less experimental anyway.

### Added
- Autofixer for newline-after-import. ([#686] + [#696], thanks [@eelyafi])

## [2.4.0] - 2017-06-02 [YANKED]

Yanked due to critical issue in eslint-module-utils with cache key resulting from [#839].

### Added
- Add `filePath` into `parserOptions` passed to `parser` ([#839], thanks [@sompylasar])
- Add `allow` option to [`no-unassigned-import`] to allow for files that match the globs ([#671], [#737], thanks [@kevin940726]).

## [2.3.0] - 2017-05-18
### Added
- [`no-anonymous-default-export`] rule: report anonymous default exports ([#712], thanks [@duncanbeevers]).
- Add new value to [`order`]'s `newlines-between` option to allow newlines inside import groups ([#627], [#628], thanks [@giodamelio])
- Add `count` option to the [`newline-after-import`] rule to allow configuration of number of newlines expected ([#742], thanks [@ntdb])

### Changed
- [`no-extraneous-dependencies`]: use `read-pkg-up` to simplify finding + loading `package.json` ([#680], thanks [@wtgtybhertgeghgtwtg])
- Add support to specify the package.json [`no-extraneous-dependencies`] ([#685], thanks [@ramasilveyra])

### Fixed
- attempt to fix crash in [`no-mutable-exports`]. ([#660])
- "default is a reserved keyword" in no-maned-default tests by locking down babylon to 6.15.0 (#756, thanks @gmathieu)
- support scoped modules containing non word characters


## [2.2.0] - 2016-11-07
### Fixed
- Corrected a few gaffs in the auto-ignore logic to fix major performance issues
  with projects that did not explicitly ignore `node_modules`. ([#654])
- [`import/ignore` setting] was only being respected if the ignored module didn't start with
  an `import` or `export` JS statement
- [`prefer-default-export`]: fixed crash on export extensions ([#653])

## [2.1.0] - 2016-11-02
### Added
- Add [`no-named-default`] rule: style-guide rule to report use of unnecessarily named default imports ([#596], thanks [@ntdb])
- [`no-extraneous-dependencies`]: check globs against CWD + absolute path ([#602] + [#630], thanks [@ljharb])

### Fixed
- [`prefer-default-export`] handles flow `export type` ([#484] + [#639], thanks [@jakubsta])
- [`prefer-default-export`] handles re-exported default exports ([#609])
- Fix crash when using [`newline-after-import`] with decorators ([#592])
- Properly report [`newline-after-import`] when next line is a decorator
- Fixed documentation for the default values for the [`order`] rule ([#601])

## [2.0.1] - 2016-10-06
### Fixed
- Fixed code that relied on removed dependencies. ([#604])

## [2.0.0]! - 2016-09-30
### Added
- [`unambiguous`] rule: report modules that are not unambiguously ES modules.
- `recommended` shared config. Roughly `errors` and `warnings` mixed together,
  with some `parserOptions` in the mix. ([#402])
- `react` shared config: added `jsx: true` to `parserOptions.ecmaFeatures`.
- Added [`no-webpack-loader-syntax`] rule: forbid custom Webpack loader syntax in imports. ([#586], thanks [@fson]!)
- Add option `newlines-between: "ignore"` to [`order`] ([#519])
- Added [`no-unassigned-import`] rule ([#529])

### Breaking
- [`import/extensions` setting] defaults to `['.js']`. ([#306])
- [`import/ignore` setting] defaults to nothing, and ambiguous modules are ignored natively. This means importing from CommonJS modules will no longer be reported by [`default`], [`named`], or [`namespace`], regardless of `import/ignore`. ([#270])
- [`newline-after-import`]: Removed need for an empty line after an inline `require` call ([#570])
- [`order`]: Default value for `newlines-between` option is now `ignore` ([#519])

### Changed
- `imports-first` is renamed to [`first`]. `imports-first` alias will continue to
  exist, but may be removed in a future major release.
- Case-sensitivity: now specifically (and optionally) reported by [`no-unresolved`].
  Other rules will ignore case-mismatches on paths on case-insensitive filesystems. ([#311])

### Fixed
- [`no-internal-modules`]: support `@`-scoped packages ([#577]+[#578], thanks [@spalger])

## [1.16.0] - 2016-09-22
### Added
- Added [`no-dynamic-require`] rule: forbid `require()` calls with expressions. ([#567], [#568])
- Added [`no-internal-modules`] rule: restrict deep package imports to specific folders. ([#485], thanks [@spalger]!)
- [`extensions`]: allow override of a chosen default with options object ([#555], thanks [@ljharb]!)

### Fixed
- [`no-named-as-default`] no longer false-positives on `export default from '...'` ([#566], thanks [@preco21])
- [`default`]: allow re-export of values from ignored files as default ([#545], thanks [@skyrpex])

## [1.15.0] - 2016-09-12
### Added
- Added an `allow` option to [`no-nodejs-modules`] to allow exceptions ([#452], [#509]).
- Added [`no-absolute-path`] rule ([#530], [#538])
- [`max-dependencies`] for specifying the maximum number of dependencies (both `import` and `require`) a module can have. (see [#489], thanks [@tizmagik])
- Added glob option to config for [`no-extraneous-dependencies`], after much bikeshedding. Thanks, [@knpwrs]! ([#527])

### Fixed
- [`no-named-as-default-member`] Allow default import to have a property named "default" ([#507], [#508], thanks [@jquense] for both!)

## [1.14.0] - 2016-08-22
### Added
- [`import/parsers` setting]: parse some dependencies (i.e. TypeScript!) with a different parser than the ESLint-configured parser. ([#503])

### Fixed
- [`namespace`] exception for get property from `namespace` import, which are re-export from commonjs module ([#499] fixes [#416], thanks [@wKich])

## [1.13.0] - 2016-08-11
### Added
- `allowComputed` option for [`namespace`] rule. If set to `true`, won't report
  computed member references to namespaces. (see [#456])

### Changed
- Modified [`no-nodejs-modules`] error message to include the module's name ([#453], [#461])

### Fixed
- [`import/extensions` setting] is respected in spite of the appearance of imports
  in an imported file. (fixes [#478], thanks [@rhys-vdw])

## [1.12.0] - 2016-07-26
### Added
- [`import/external-module-folders` setting]: a possibility to configure folders for "external" modules ([#444], thanks [@zloirock])

## [1.11.1] - 2016-07-20
### Fixed
- [`newline-after-import`] exception for `switch` branches with `require`s iff parsed as `sourceType:'module'`.
  (still [#441], thanks again [@ljharb])

## [1.11.0] - 2016-07-17
### Added
- Added an `peerDependencies` option to [`no-extraneous-dependencies`] to allow/forbid peer dependencies ([#423], [#428], thanks [@jfmengels]!).

### Fixed
- [`newline-after-import`] exception for multiple `require`s in an arrow
  function expression (e.g. `() => require('a') || require('b')`). ([#441], thanks [@ljharb])

## [1.10.3] - 2016-07-08
### Fixed
- removing `Symbol` dependencies (i.e. `for-of` loops) due to Node 0.10 polyfill
  issue (see [#415]). Should not make any discernible semantic difference.

## [1.10.2] - 2016-07-04
### Fixed
- Something horrible happened during `npm prepublish` of 1.10.1.
  Several `rm -rf node_modules && npm i` and `gulp clean && npm prepublish`s later, it is rebuilt and republished as 1.10.2. Thanks [@rhettlivingston] for noticing and reporting!

## [1.10.1] - 2016-07-02 [YANKED]
### Added
- Officially support ESLint 3.x. (peerDependencies updated to `2.x - 3.x`)

## [1.10.0] - 2016-06-30
### Added
- Added new rule [`no-restricted-paths`]. ([#155]/[#371], thanks [@lo1tuma])
- [`import/core-modules` setting]: allow configuration of additional module names,
  to be treated as builtin modules (a la `path`, etc. in Node). ([#275] + [#365], thanks [@sindresorhus] for driving)
- React Native shared config (based on comment from [#283])

### Fixed
- Fixed crash with `newline-after-import` related to the use of switch cases. (fixes [#386], thanks [@ljharb] for reporting) ([#395])

## [1.9.2] - 2016-06-21
### Fixed
- Issues with ignored/CJS files in [`export`] and [`no-deprecated`] rules. ([#348], [#370])

## [1.9.1] - 2016-06-16
### Fixed
- Reordered precedence for loading resolvers. ([#373])

## [1.9.0] - 2016-06-10
### Added
- Added support TomDoc comments to [`no-deprecated`]. ([#321], thanks [@josh])
- Added support for loading custom resolvers ([#314], thanks [@le0nik])

### Fixed
- [`prefer-default-export`] handles `export function` and `export const` in same file ([#359], thanks [@scottnonnenberg])

## [1.8.1] - 2016-05-23
### Fixed
- `export * from 'foo'` now properly ignores a `default` export from `foo`, if any. ([#328]/[#332], thanks [@jkimbo])
  This impacts all static analysis of imported names. ([`default`], [`named`], [`namespace`], [`export`])
- Make [`order`]'s `newline-between` option handle multiline import statements ([#313], thanks [@singles])
- Make [`order`]'s `newline-between` option handle not assigned import statements ([#313], thanks [@singles])
- Make [`order`]'s `newline-between` option ignore `require` statements inside object literals ([#313], thanks [@singles])
- [`prefer-default-export`] properly handles deep destructuring, `export * from ...`, and files with no exports. ([#342]+[#343], thanks [@scottnonnenberg])

## [1.8.0] - 2016-05-11
### Added
- [`prefer-default-export`], new rule. ([#308], thanks [@gavriguy])

### Fixed
- Ignore namespace / ES7 re-exports in [`no-mutable-exports`]. ([#317], fixed by [#322]. thanks [@borisyankov] + [@jfmengels])
- Make [`no-extraneous-dependencies`] handle scoped packages ([#316], thanks [@jfmengels])

## [1.7.0] - 2016-05-06
### Added
- [`newline-after-import`], new rule. ([#245], thanks [@singles])
- Added an `optionalDependencies` option to [`no-extraneous-dependencies`] to allow/forbid optional dependencies ([#266], thanks [@jfmengels]).
- Added `newlines-between` option to [`order`] rule ([#298], thanks [@singles])
- add [`no-mutable-exports`] rule ([#290], thanks [@josh])
- [`import/extensions` setting]: a list of file extensions to parse as modules
  and search for `export`s. If unspecified, all extensions are considered valid (for now).
  In v2, this will likely default to `['.js', MODULE_EXT]`. ([#297], to fix [#267])

### Fixed
- [`extensions`]: fallback to source path for extension enforcement if imported
  module is not resolved. Also, never report for builtins (i.e. `path`). ([#296])

## [1.6.1] - 2016-04-28
### Fixed
- [`no-named-as-default-member`]: don't crash on rest props. ([#281], thanks [@SimenB])
- support for Node 6: don't pass `null` to `path` functions.
  Thanks to [@strawbrary] for bringing this up ([#272]) and adding OSX support to the Travis
  config ([#288]).

## [1.6.0] - 2016-04-25
### Added
- add [`no-named-as-default-member`] to `warnings` canned config
- add [`no-extraneous-dependencies`] rule ([#241], thanks [@jfmengels])
- add [`extensions`] rule ([#250], thanks [@lo1tuma])
- add [`no-nodejs-modules`] rule ([#261], thanks [@jfmengels])
- add [`order`] rule ([#247], thanks [@jfmengels])
- consider `resolve.fallback` config option in the webpack resolver ([#254])

### Changed
- [`imports-first`] now allows directives (i.e. `'use strict'`) strictly before
  any imports ([#256], thanks [@lemonmade])

### Fixed
- [`named`] now properly ignores the source module if a name is re-exported from
  an ignored file (i.e. `node_modules`). Also improved the reported error. (thanks to [@jimbolla] for reporting)
- [`no-named-as-default-member`] had a crash on destructuring in loops (thanks for heads up from [@lemonmade])

## [1.5.0] - 2016-04-18
### Added
- report resolver errors at the top of the linted file
- add [`no-namespace`] rule ([#239], thanks [@singles])
- add [`no-named-as-default-member`] rule ([#243], thanks [@dmnd])

### Changed
- Rearranged rule groups in README in preparation for more style guide rules

### Removed
- support for Node 0.10, via `es6-*` ponyfills. Using native Map/Set/Symbol.

## [1.4.0] - 2016-03-25
### Added
- Resolver plugin interface v2: more explicit response format that more clearly covers the found-but-core-module case, where there is no path.
  Still backwards-compatible with the original version of the resolver spec.
- [Resolver documentation](./resolvers/README.md)

### Changed
- using `package.json/files` instead of `.npmignore` for package file inclusion ([#228], thanks [@mathieudutour])
- using `es6-*` ponyfills instead of `babel-runtime`

## [1.3.0] - 2016-03-20
Major perf improvements. Between parsing only once and ignoring gigantic, non-module `node_modules`,
there is very little added time.

My test project takes 17s to lint completely, down from 55s, when using the
memoizing parser, and takes only 27s with naked `babel-eslint` (thus, reparsing local modules).

### Added
- This change log ([#216])
- Experimental memoizing [parser](./memo-parser/README.md)

### Fixed
- Huge reduction in execution time by _only_ ignoring [`import/ignore` setting] if
  something that looks like an `export` is detected in the module content.

## [1.2.0] - 2016-03-19
Thanks [@lencioni] for identifying a huge amount of rework in resolve and kicking
off a bunch of memoization.

I'm seeing 62% improvement over my normal test codebase when executing only
[`no-unresolved`] in isolation, and ~35% total reduction in lint time.

### Changed
- added caching to core/resolve via [#214], configured via [`import/cache` setting]

## [1.1.0] - 2016-03-15
### Added
- Added an [`ignore`](./docs/rules/no-unresolved.md#ignore) option to [`no-unresolved`] for those pesky files that no resolver can find. (still prefer enhancing the Webpack and Node resolvers to using it, though). See [#89] for details.

## [1.0.4] - 2016-03-11

### Changed
- respect hoisting for deep namespaces ([`namespace`]/[`no-deprecated`]) ([#211])

### Fixed
- don't crash on self references ([#210])
- correct cache behavior in `eslint_d` for deep namespaces ([#200])

## [1.0.3] - 2016-02-26

### Changed
- no-deprecated follows deep namespaces ([#191])

### Fixed
- [`namespace`] no longer flags modules with only a default export as having no names. (ns.default is valid ES6)

## [1.0.2] - 2016-02-26

### Fixed
- don't parse imports with no specifiers ([#192])

## [1.0.1] - 2016-02-25

### Fixed
- export `stage-0` shared config
- documented [`no-deprecated`]
- deep namespaces are traversed regardless of how they get imported ([#189])

## [1.0.0] - 2016-02-24

### Added
- [`no-deprecated`]: WIP rule to let you know at lint time if you're using deprecated functions, constants, classes, or modules.

### Changed
- [`namespace`]: support deep namespaces ([#119] via [#157])

## [1.0.0-beta.0] - 2016-02-13

### Changed
- support for (only) ESLint 2.x
- no longer needs/refers to `import/parser` or `import/parse-options`. Instead, ESLint provides the configured parser + options to the rules, and they use that to parse dependencies.

### Removed

- `babylon` as default import parser (see Breaking)

## [0.13.0] - 2016-02-08
### Added
- [`no-commonjs`] rule
- [`no-amd`] rule

### Removed
- Removed vestigial `no-require` rule. [`no-commonjs`] is more complete.

## [0.12.2] - 2016-02-06 [YANKED]
Unpublished from npm and re-released as 0.13.0. See [#170].

## [0.12.1] - 2015-12-17
### Changed
- Broke docs for rules out into individual files.

## [0.12.0] - 2015-12-14
### Changed
- Ignore [`import/ignore` setting] if exports are actually found in the parsed module. Does this to support use of `jsnext:main` in `node_modules` without the pain of managing an allow list or a nuanced deny list.

## [0.11.0] - 2015-11-27
### Added
- Resolver plugins. Now the linter can read Webpack config, properly follow aliases and ignore externals, dismisses inline loaders, etc. etc.!

## Earlier releases (0.10.1 and younger)
See [GitHub release notes](https://github.com/benmosher/eslint-plugin-import/releases?after=v0.11.0)
for info on changes for earlier releases.


[`import/cache` setting]: ./README.md#importcache
[`import/ignore` setting]: ./README.md#importignore
[`import/extensions` setting]: ./README.md#importextensions
[`import/parsers` setting]: ./README.md#importparsers
[`import/core-modules` setting]: ./README.md#importcore-modules
[`import/external-module-folders` setting]: ./README.md#importexternal-module-folders
[`internal-regex` setting]: ./README.md#importinternal-regex

[`default`]: ./docs/rules/default.md
[`dynamic-import-chunkname`]: ./docs/rules/dynamic-import-chunkname.md
[`export`]: ./docs/rules/export.md
[`exports-last`]: ./docs/rules/exports-last.md
[`extensions`]: ./docs/rules/extensions.md
[`first`]: ./docs/rules/first.md
[`group-exports`]: ./docs/rules/group-exports.md
[`imports-first`]: ./docs/rules/first.md
[`max-dependencies`]: ./docs/rules/max-dependencies.md
[`named`]: ./docs/rules/named.md
[`namespace`]: ./docs/rules/namespace.md
[`newline-after-import`]: ./docs/rules/newline-after-import.md
[`no-absolute-path`]: ./docs/rules/no-absolute-path.md
[`no-amd`]: ./docs/rules/no-amd.md
[`no-anonymous-default-export`]: ./docs/rules/no-anonymous-default-export.md
[`no-commonjs`]: ./docs/rules/no-commonjs.md
[`no-cycle`]: ./docs/rules/no-cycle.md
[`no-default-export`]: ./docs/rules/no-default-export.md
[`no-deprecated`]: ./docs/rules/no-deprecated.md
[`no-duplicates`]: ./docs/rules/no-duplicates.md
[`no-dynamic-require`]: ./docs/rules/no-dynamic-require.md
[`no-extraneous-dependencies`]: ./docs/rules/no-extraneous-dependencies.md
[`no-internal-modules`]: ./docs/rules/no-internal-modules.md
[`no-mutable-exports`]: ./docs/rules/no-mutable-exports.md
[`no-named-as-default-member`]: ./docs/rules/no-named-as-default-member.md
[`no-named-as-default`]: ./docs/rules/no-named-as-default.md
[`no-named-default`]: ./docs/rules/no-named-default.md
[`no-named-export`]: ./docs/rules/no-named-export.md
[`no-namespace`]: ./docs/rules/no-namespace.md
[`no-nodejs-modules`]: ./docs/rules/no-nodejs-modules.md
[`no-restricted-paths`]: ./docs/rules/no-restricted-paths.md
[`no-self-import`]: ./docs/rules/no-self-import.md
[`no-unassigned-import`]: ./docs/rules/no-unassigned-import.md
[`no-unresolved`]: ./docs/rules/no-unresolved.md
[`no-unused-modules`]: ./docs/rules/no-unused-modules.md
[`no-useless-path-segments`]: ./docs/rules/no-useless-path-segments.md
[`no-webpack-loader-syntax`]: ./docs/rules/no-webpack-loader-syntax.md
[`order`]: ./docs/rules/order.md
[`prefer-default-export`]: ./docs/rules/prefer-default-export.md
[`unambiguous`]: ./docs/rules/unambiguous.md

[`memo-parser`]: ./memo-parser/README.md

[#1917]: https://github.com/benmosher/eslint-plugin-import/pull/1917
[#1889]: https://github.com/benmosher/eslint-plugin-import/pull/1889
[#1878]: https://github.com/benmosher/eslint-plugin-import/pull/1878
[#1854]: https://github.com/benmosher/eslint-plugin-import/issues/1854
[#1848]: https://github.com/benmosher/eslint-plugin-import/pull/1848
[#1841]: https://github.com/benmosher/eslint-plugin-import/issues/1841
[#1836]: https://github.com/benmosher/eslint-plugin-import/pull/1836
[#1835]: https://github.com/benmosher/eslint-plugin-import/pull/1835
[#1834]: https://github.com/benmosher/eslint-plugin-import/issues/1834
[#1833]: https://github.com/benmosher/eslint-plugin-import/pull/1833
[#1831]: https://github.com/benmosher/eslint-plugin-import/pull/1831
[#1830]: https://github.com/benmosher/eslint-plugin-import/pull/1830
[#1824]: https://github.com/benmosher/eslint-plugin-import/pull/1824
[#1823]: https://github.com/benmosher/eslint-plugin-import/pull/1823
[#1822]: https://github.com/benmosher/eslint-plugin-import/pull/1822
[#1820]: https://github.com/benmosher/eslint-plugin-import/pull/1820
[#1819]: https://github.com/benmosher/eslint-plugin-import/pull/1819
[#1802]: https://github.com/benmosher/eslint-plugin-import/pull/1802
[#1801]: https://github.com/benmosher/eslint-plugin-import/issues/1801
[#1788]: https://github.com/benmosher/eslint-plugin-import/pull/1788
[#1786]: https://github.com/benmosher/eslint-plugin-import/pull/1786
[#1785]: https://github.com/benmosher/eslint-plugin-import/pull/1785
[#1776]: https://github.com/benmosher/eslint-plugin-import/pull/1776
[#1770]: https://github.com/benmosher/eslint-plugin-import/pull/1770
[#1764]: https://github.com/benmosher/eslint-plugin-import/pull/1764
[#1763]: https://github.com/benmosher/eslint-plugin-import/pull/1763
[#1751]: https://github.com/benmosher/eslint-plugin-import/pull/1751
[#1744]: https://github.com/benmosher/eslint-plugin-import/pull/1744
[#1736]: https://github.com/benmosher/eslint-plugin-import/pull/1736
[#1735]: https://github.com/benmosher/eslint-plugin-import/pull/1735
[#1726]: https://github.com/benmosher/eslint-plugin-import/pull/1726
[#1724]: https://github.com/benmosher/eslint-plugin-import/pull/1724
[#1722]: https://github.com/benmosher/eslint-plugin-import/issues/1722
[#1719]: https://github.com/benmosher/eslint-plugin-import/pull/1719
[#1704]: https://github.com/benmosher/eslint-plugin-import/issues/1704
[#1702]: https://github.com/benmosher/eslint-plugin-import/issues/1702
[#1691]: https://github.com/benmosher/eslint-plugin-import/pull/1691
[#1690]: https://github.com/benmosher/eslint-plugin-import/pull/1690
[#1689]: https://github.com/benmosher/eslint-plugin-import/pull/1689
[#1681]: https://github.com/benmosher/eslint-plugin-import/pull/1681
[#1676]: https://github.com/benmosher/eslint-plugin-import/pull/1676
[#1666]: https://github.com/benmosher/eslint-plugin-import/pull/1666
[#1664]: https://github.com/benmosher/eslint-plugin-import/pull/1664
[#1658]: https://github.com/benmosher/eslint-plugin-import/pull/1658
[#1651]: https://github.com/benmosher/eslint-plugin-import/pull/1651
[#1635]: https://github.com/benmosher/eslint-plugin-import/issues/1635
[#1631]: https://github.com/benmosher/eslint-plugin-import/issues/1631
[#1625]: https://github.com/benmosher/eslint-plugin-import/pull/1625
[#1620]: https://github.com/benmosher/eslint-plugin-import/pull/1620
[#1619]: https://github.com/benmosher/eslint-plugin-import/pull/1619
[#1616]: https://github.com/benmosher/eslint-plugin-import/issues/1616
[#1613]: https://github.com/benmosher/eslint-plugin-import/issues/1613
[#1612]: https://github.com/benmosher/eslint-plugin-import/pull/1612
[#1611]: https://github.com/benmosher/eslint-plugin-import/pull/1611
[#1605]: https://github.com/benmosher/eslint-plugin-import/pull/1605
[#1589]: https://github.com/benmosher/eslint-plugin-import/issues/1589
[#1586]: https://github.com/benmosher/eslint-plugin-import/pull/1586
[#1572]: https://github.com/benmosher/eslint-plugin-import/pull/1572
[#1569]: https://github.com/benmosher/eslint-plugin-import/pull/1569
[#1563]: https://github.com/benmosher/eslint-plugin-import/pull/1563
[#1560]: https://github.com/benmosher/eslint-plugin-import/pull/1560
[#1551]: https://github.com/benmosher/eslint-plugin-import/pull/1551
[#1542]: https://github.com/benmosher/eslint-plugin-import/pull/1542
[#1528]: https://github.com/benmosher/eslint-plugin-import/pull/1528
[#1526]: https://github.com/benmosher/eslint-plugin-import/pull/1526
[#1521]: https://github.com/benmosher/eslint-plugin-import/pull/1521
[#1519]: https://github.com/benmosher/eslint-plugin-import/pull/1519
[#1507]: https://github.com/benmosher/eslint-plugin-import/pull/1507
[#1506]: https://github.com/benmosher/eslint-plugin-import/pull/1506
[#1496]: https://github.com/benmosher/eslint-plugin-import/pull/1496
[#1495]: https://github.com/benmosher/eslint-plugin-import/pull/1495
[#1494]: https://github.com/benmosher/eslint-plugin-import/pull/1494
[#1493]: https://github.com/benmosher/eslint-plugin-import/pull/1493
[#1472]: https://github.com/benmosher/eslint-plugin-import/pull/1472
[#1470]: https://github.com/benmosher/eslint-plugin-import/pull/1470
[#1447]: https://github.com/benmosher/eslint-plugin-import/pull/1447
[#1439]: https://github.com/benmosher/eslint-plugin-import/pull/1439
[#1436]: https://github.com/benmosher/eslint-plugin-import/pull/1436
[#1435]: https://github.com/benmosher/eslint-plugin-import/pull/1435
[#1425]: https://github.com/benmosher/eslint-plugin-import/pull/1425
[#1419]: https://github.com/benmosher/eslint-plugin-import/pull/1419
[#1412]: https://github.com/benmosher/eslint-plugin-import/pull/1412
[#1409]: https://github.com/benmosher/eslint-plugin-import/pull/1409
[#1404]: https://github.com/benmosher/eslint-plugin-import/pull/1404
[#1401]: https://github.com/benmosher/eslint-plugin-import/pull/1401
[#1393]: https://github.com/benmosher/eslint-plugin-import/pull/1393
[#1389]: https://github.com/benmosher/eslint-plugin-import/pull/1389
[#1386]: https://github.com/benmosher/eslint-plugin-import/pull/1386
[#1377]: https://github.com/benmosher/eslint-plugin-import/pull/1377
[#1375]: https://github.com/benmosher/eslint-plugin-import/pull/1375
[#1372]: https://github.com/benmosher/eslint-plugin-import/pull/1372
[#1371]: https://github.com/benmosher/eslint-plugin-import/pull/1371
[#1370]: https://github.com/benmosher/eslint-plugin-import/pull/1370
[#1363]: https://github.com/benmosher/eslint-plugin-import/pull/1363
[#1360]: https://github.com/benmosher/eslint-plugin-import/pull/1360
[#1358]: https://github.com/benmosher/eslint-plugin-import/pull/1358
[#1356]: https://github.com/benmosher/eslint-plugin-import/pull/1356
[#1354]: https://github.com/benmosher/eslint-plugin-import/pull/1354
[#1352]: https://github.com/benmosher/eslint-plugin-import/pull/1352
[#1347]: https://github.com/benmosher/eslint-plugin-import/pull/1347
[#1345]: https://github.com/benmosher/eslint-plugin-import/pull/1345
[#1342]: https://github.com/benmosher/eslint-plugin-import/pull/1342
[#1340]: https://github.com/benmosher/eslint-plugin-import/pull/1340
[#1333]: https://github.com/benmosher/eslint-plugin-import/pull/1333
[#1331]: https://github.com/benmosher/eslint-plugin-import/pull/1331
[#1330]: https://github.com/benmosher/eslint-plugin-import/pull/1330
[#1320]: https://github.com/benmosher/eslint-plugin-import/pull/1320
[#1319]: https://github.com/benmosher/eslint-plugin-import/pull/1319
[#1312]: https://github.com/benmosher/eslint-plugin-import/pull/1312
[#1308]: https://github.com/benmosher/eslint-plugin-import/pull/1308
[#1304]: https://github.com/benmosher/eslint-plugin-import/pull/1304
[#1297]: https://github.com/benmosher/eslint-plugin-import/pull/1297
[#1295]: https://github.com/benmosher/eslint-plugin-import/pull/1295
[#1294]: https://github.com/benmosher/eslint-plugin-import/pull/1294
[#1290]: https://github.com/benmosher/eslint-plugin-import/pull/1290
[#1277]: https://github.com/benmosher/eslint-plugin-import/pull/1277
[#1257]: https://github.com/benmosher/eslint-plugin-import/pull/1257
[#1253]: https://github.com/benmosher/eslint-plugin-import/pull/1253
[#1248]: https://github.com/benmosher/eslint-plugin-import/pull/1248
[#1238]: https://github.com/benmosher/eslint-plugin-import/pull/1238
[#1235]: https://github.com/benmosher/eslint-plugin-import/pull/1235
[#1234]: https://github.com/benmosher/eslint-plugin-import/pull/1234
[#1232]: https://github.com/benmosher/eslint-plugin-import/pull/1232
[#1218]: https://github.com/benmosher/eslint-plugin-import/pull/1218
[#1176]: https://github.com/benmosher/eslint-plugin-import/pull/1176
[#1163]: https://github.com/benmosher/eslint-plugin-import/pull/1163
[#1157]: https://github.com/benmosher/eslint-plugin-import/pull/1157
[#1151]: https://github.com/benmosher/eslint-plugin-import/pull/1151
[#1142]: https://github.com/benmosher/eslint-plugin-import/pull/1142
[#1139]: https://github.com/benmosher/eslint-plugin-import/pull/1139
[#1137]: https://github.com/benmosher/eslint-plugin-import/pull/1137
[#1135]: https://github.com/benmosher/eslint-plugin-import/pull/1135
[#1128]: https://github.com/benmosher/eslint-plugin-import/pull/1128
[#1126]: https://github.com/benmosher/eslint-plugin-import/pull/1126
[#1122]: https://github.com/benmosher/eslint-plugin-import/pull/1122
[#1112]: https://github.com/benmosher/eslint-plugin-import/pull/1112
[#1107]: https://github.com/benmosher/eslint-plugin-import/pull/1107
[#1106]: https://github.com/benmosher/eslint-plugin-import/pull/1106
[#1105]: https://github.com/benmosher/eslint-plugin-import/pull/1105
[#1093]: https://github.com/benmosher/eslint-plugin-import/pull/1093
[#1085]: https://github.com/benmosher/eslint-plugin-import/pull/1085
[#1068]: https://github.com/benmosher/eslint-plugin-import/pull/1068
[#1049]: https://github.com/benmosher/eslint-plugin-import/pull/1049
[#1046]: https://github.com/benmosher/eslint-plugin-import/pull/1046
[#944]: https://github.com/benmosher/eslint-plugin-import/pull/944
[#912]: https://github.com/benmosher/eslint-plugin-import/pull/912
[#908]: https://github.com/benmosher/eslint-plugin-import/pull/908
[#891]: https://github.com/benmosher/eslint-plugin-import/pull/891
[#889]: https://github.com/benmosher/eslint-plugin-import/pull/889
[#880]: https://github.com/benmosher/eslint-plugin-import/pull/880
[#871]: https://github.com/benmosher/eslint-plugin-import/pull/871
[#858]: https://github.com/benmosher/eslint-plugin-import/pull/858
[#843]: https://github.com/benmosher/eslint-plugin-import/pull/843
[#797]: https://github.com/benmosher/eslint-plugin-import/pull/797
[#794]: https://github.com/benmosher/eslint-plugin-import/pull/794
[#744]: https://github.com/benmosher/eslint-plugin-import/pull/744
[#742]: https://github.com/benmosher/eslint-plugin-import/pull/742
[#737]: https://github.com/benmosher/eslint-plugin-import/pull/737
[#727]: https://github.com/benmosher/eslint-plugin-import/pull/727
[#721]: https://github.com/benmosher/eslint-plugin-import/pull/721
[#712]: https://github.com/benmosher/eslint-plugin-import/pull/712
[#696]: https://github.com/benmosher/eslint-plugin-import/pull/696
[#685]: https://github.com/benmosher/eslint-plugin-import/pull/685
[#680]: https://github.com/benmosher/eslint-plugin-import/pull/680
[#654]: https://github.com/benmosher/eslint-plugin-import/pull/654
[#639]: https://github.com/benmosher/eslint-plugin-import/pull/639
[#632]: https://github.com/benmosher/eslint-plugin-import/pull/632
[#630]: https://github.com/benmosher/eslint-plugin-import/pull/630
[#629]: https://github.com/benmosher/eslint-plugin-import/pull/629
[#628]: https://github.com/benmosher/eslint-plugin-import/pull/628
[#596]: https://github.com/benmosher/eslint-plugin-import/pull/596
[#586]: https://github.com/benmosher/eslint-plugin-import/pull/586
[#578]: https://github.com/benmosher/eslint-plugin-import/pull/578
[#568]: https://github.com/benmosher/eslint-plugin-import/pull/568
[#555]: https://github.com/benmosher/eslint-plugin-import/pull/555
[#538]: https://github.com/benmosher/eslint-plugin-import/pull/538
[#527]: https://github.com/benmosher/eslint-plugin-import/pull/527
[#518]: https://github.com/benmosher/eslint-plugin-import/pull/518
[#509]: https://github.com/benmosher/eslint-plugin-import/pull/509
[#508]: https://github.com/benmosher/eslint-plugin-import/pull/508
[#503]: https://github.com/benmosher/eslint-plugin-import/pull/503
[#499]: https://github.com/benmosher/eslint-plugin-import/pull/499
[#489]: https://github.com/benmosher/eslint-plugin-import/pull/489
[#485]: https://github.com/benmosher/eslint-plugin-import/pull/485
[#461]: https://github.com/benmosher/eslint-plugin-import/pull/461
[#449]: https://github.com/benmosher/eslint-plugin-import/pull/449
[#444]: https://github.com/benmosher/eslint-plugin-import/pull/444
[#428]: https://github.com/benmosher/eslint-plugin-import/pull/428
[#395]: https://github.com/benmosher/eslint-plugin-import/pull/395
[#371]: https://github.com/benmosher/eslint-plugin-import/pull/371
[#365]: https://github.com/benmosher/eslint-plugin-import/pull/365
[#359]: https://github.com/benmosher/eslint-plugin-import/pull/359
[#343]: https://github.com/benmosher/eslint-plugin-import/pull/343
[#332]: https://github.com/benmosher/eslint-plugin-import/pull/332
[#322]: https://github.com/benmosher/eslint-plugin-import/pull/322
[#321]: https://github.com/benmosher/eslint-plugin-import/pull/321
[#316]: https://github.com/benmosher/eslint-plugin-import/pull/316
[#314]: https://github.com/benmosher/eslint-plugin-import/pull/314
[#308]: https://github.com/benmosher/eslint-plugin-import/pull/308
[#298]: https://github.com/benmosher/eslint-plugin-import/pull/298
[#297]: https://github.com/benmosher/eslint-plugin-import/pull/297
[#296]: https://github.com/benmosher/eslint-plugin-import/pull/296
[#290]: https://github.com/benmosher/eslint-plugin-import/pull/290
[#289]: https://github.com/benmosher/eslint-plugin-import/pull/289
[#288]: https://github.com/benmosher/eslint-plugin-import/pull/288
[#287]: https://github.com/benmosher/eslint-plugin-import/pull/287
[#278]: https://github.com/benmosher/eslint-plugin-import/pull/278
[#261]: https://github.com/benmosher/eslint-plugin-import/pull/261
[#256]: https://github.com/benmosher/eslint-plugin-import/pull/256
[#254]: https://github.com/benmosher/eslint-plugin-import/pull/254
[#250]: https://github.com/benmosher/eslint-plugin-import/pull/250
[#247]: https://github.com/benmosher/eslint-plugin-import/pull/247
[#245]: https://github.com/benmosher/eslint-plugin-import/pull/245
[#243]: https://github.com/benmosher/eslint-plugin-import/pull/243
[#241]: https://github.com/benmosher/eslint-plugin-import/pull/241
[#239]: https://github.com/benmosher/eslint-plugin-import/pull/239
[#228]: https://github.com/benmosher/eslint-plugin-import/pull/228
[#211]: https://github.com/benmosher/eslint-plugin-import/pull/211
[#164]: https://github.com/benmosher/eslint-plugin-import/pull/164
[#157]: https://github.com/benmosher/eslint-plugin-import/pull/157
[#1814]: https://github.com/benmosher/eslint-plugin-import/issues/1814
[#1811]: https://github.com/benmosher/eslint-plugin-import/issues/1811
[#1808]: https://github.com/benmosher/eslint-plugin-import/issues/1808
[#1805]: https://github.com/benmosher/eslint-plugin-import/issues/1805
[#1565]: https://github.com/benmosher/eslint-plugin-import/issues/1565
[#1366]: https://github.com/benmosher/eslint-plugin-import/issues/1366
[#1334]: https://github.com/benmosher/eslint-plugin-import/issues/1334
[#1323]: https://github.com/benmosher/eslint-plugin-import/issues/1323
[#1322]: https://github.com/benmosher/eslint-plugin-import/issues/1322
[#1300]: https://github.com/benmosher/eslint-plugin-import/issues/1300
[#1293]: https://github.com/benmosher/eslint-plugin-import/issues/1293
[#1266]: https://github.com/benmosher/eslint-plugin-import/issues/1266
[#1256]: https://github.com/benmosher/eslint-plugin-import/issues/1256
[#1233]: https://github.com/benmosher/eslint-plugin-import/issues/1233
[#1175]: https://github.com/benmosher/eslint-plugin-import/issues/1175
[#1166]: https://github.com/benmosher/eslint-plugin-import/issues/1166
[#1144]: https://github.com/benmosher/eslint-plugin-import/issues/1144
[#1058]: https://github.com/benmosher/eslint-plugin-import/issues/1058
[#1035]: https://github.com/benmosher/eslint-plugin-import/issues/1035
[#931]: https://github.com/benmosher/eslint-plugin-import/issues/931
[#886]: https://github.com/benmosher/eslint-plugin-import/issues/886
[#863]: https://github.com/benmosher/eslint-plugin-import/issues/863
[#842]: https://github.com/benmosher/eslint-plugin-import/issues/842
[#839]: https://github.com/benmosher/eslint-plugin-import/issues/839
[#795]: https://github.com/benmosher/eslint-plugin-import/issues/795
[#793]: https://github.com/benmosher/eslint-plugin-import/issues/793
[#720]: https://github.com/benmosher/eslint-plugin-import/issues/720
[#717]: https://github.com/benmosher/eslint-plugin-import/issues/717
[#686]: https://github.com/benmosher/eslint-plugin-import/issues/686
[#671]: https://github.com/benmosher/eslint-plugin-import/issues/671
[#660]: https://github.com/benmosher/eslint-plugin-import/issues/660
[#653]: https://github.com/benmosher/eslint-plugin-import/issues/653
[#627]: https://github.com/benmosher/eslint-plugin-import/issues/627
[#620]: https://github.com/benmosher/eslint-plugin-import/issues/620
[#609]: https://github.com/benmosher/eslint-plugin-import/issues/609
[#604]: https://github.com/benmosher/eslint-plugin-import/issues/604
[#602]: https://github.com/benmosher/eslint-plugin-import/issues/602
[#601]: https://github.com/benmosher/eslint-plugin-import/issues/601
[#592]: https://github.com/benmosher/eslint-plugin-import/issues/592
[#577]: https://github.com/benmosher/eslint-plugin-import/issues/577
[#570]: https://github.com/benmosher/eslint-plugin-import/issues/570
[#567]: https://github.com/benmosher/eslint-plugin-import/issues/567
[#566]: https://github.com/benmosher/eslint-plugin-import/issues/566
[#545]: https://github.com/benmosher/eslint-plugin-import/issues/545
[#530]: https://github.com/benmosher/eslint-plugin-import/issues/530
[#529]: https://github.com/benmosher/eslint-plugin-import/issues/529
[#519]: https://github.com/benmosher/eslint-plugin-import/issues/519
[#507]: https://github.com/benmosher/eslint-plugin-import/issues/507
[#484]: https://github.com/benmosher/eslint-plugin-import/issues/484
[#478]: https://github.com/benmosher/eslint-plugin-import/issues/478
[#456]: https://github.com/benmosher/eslint-plugin-import/issues/456
[#453]: https://github.com/benmosher/eslint-plugin-import/issues/453
[#452]: https://github.com/benmosher/eslint-plugin-import/issues/452
[#447]: https://github.com/benmosher/eslint-plugin-import/issues/447
[#441]: https://github.com/benmosher/eslint-plugin-import/issues/441
[#423]: https://github.com/benmosher/eslint-plugin-import/issues/423
[#416]: https://github.com/benmosher/eslint-plugin-import/issues/416
[#415]: https://github.com/benmosher/eslint-plugin-import/issues/415
[#402]: https://github.com/benmosher/eslint-plugin-import/issues/402
[#386]: https://github.com/benmosher/eslint-plugin-import/issues/386
[#373]: https://github.com/benmosher/eslint-plugin-import/issues/373
[#370]: https://github.com/benmosher/eslint-plugin-import/issues/370
[#348]: https://github.com/benmosher/eslint-plugin-import/issues/348
[#342]: https://github.com/benmosher/eslint-plugin-import/issues/342
[#328]: https://github.com/benmosher/eslint-plugin-import/issues/328
[#317]: https://github.com/benmosher/eslint-plugin-import/issues/317
[#313]: https://github.com/benmosher/eslint-plugin-import/issues/313
[#311]: https://github.com/benmosher/eslint-plugin-import/issues/311
[#306]: https://github.com/benmosher/eslint-plugin-import/issues/306
[#286]: https://github.com/benmosher/eslint-plugin-import/issues/286
[#283]: https://github.com/benmosher/eslint-plugin-import/issues/283
[#281]: https://github.com/benmosher/eslint-plugin-import/issues/281
[#275]: https://github.com/benmosher/eslint-plugin-import/issues/275
[#272]: https://github.com/benmosher/eslint-plugin-import/issues/272
[#270]: https://github.com/benmosher/eslint-plugin-import/issues/270
[#267]: https://github.com/benmosher/eslint-plugin-import/issues/267
[#266]: https://github.com/benmosher/eslint-plugin-import/issues/266
[#216]: https://github.com/benmosher/eslint-plugin-import/issues/216
[#214]: https://github.com/benmosher/eslint-plugin-import/issues/214
[#210]: https://github.com/benmosher/eslint-plugin-import/issues/210
[#200]: https://github.com/benmosher/eslint-plugin-import/issues/200
[#192]: https://github.com/benmosher/eslint-plugin-import/issues/192
[#191]: https://github.com/benmosher/eslint-plugin-import/issues/191
[#189]: https://github.com/benmosher/eslint-plugin-import/issues/189
[#170]: https://github.com/benmosher/eslint-plugin-import/issues/170
[#155]: https://github.com/benmosher/eslint-plugin-import/issues/155
[#119]: https://github.com/benmosher/eslint-plugin-import/issues/119
[#89]: https://github.com/benmosher/eslint-plugin-import/issues/89

[Unreleased]: https://github.com/benmosher/eslint-plugin-import/compare/v2.22.1...HEAD
[2.22.1]: https://github.com/benmosher/eslint-plugin-import/compare/v2.22.0...v2.22.1
[2.22.0]: https://github.com/benmosher/eslint-plugin-import/compare/v2.21.1...v2.22.0
[2.21.2]: https://github.com/benmosher/eslint-plugin-import/compare/v2.21.1...v2.21.2
[2.21.1]: https://github.com/benmosher/eslint-plugin-import/compare/v2.21.0...v2.21.1
[2.21.0]: https://github.com/benmosher/eslint-plugin-import/compare/v2.20.2...v2.21.0
[2.20.1]: https://github.com/benmosher/eslint-plugin-import/compare/v2.20.1...v2.20.2
[2.20.0]: https://github.com/benmosher/eslint-plugin-import/compare/v2.20.0...v2.20.1
[2.19.1]: https://github.com/benmosher/eslint-plugin-import/compare/v2.19.1...v2.20.0
[2.19.1]: https://github.com/benmosher/eslint-plugin-import/compare/v2.19.0...v2.19.1
[2.19.0]: https://github.com/benmosher/eslint-plugin-import/compare/v2.18.2...v2.19.0
[2.18.2]: https://github.com/benmosher/eslint-plugin-import/compare/v2.18.1...v2.18.2
[2.18.1]: https://github.com/benmosher/eslint-plugin-import/compare/v2.18.0...v2.18.1
[2.18.0]: https://github.com/benmosher/eslint-plugin-import/compare/v2.17.3...v2.18.0
[2.17.3]: https://github.com/benmosher/eslint-plugin-import/compare/v2.17.2...v2.17.3
[2.17.2]: https://github.com/benmosher/eslint-plugin-import/compare/v2.17.1...v2.17.2
[2.17.1]: https://github.com/benmosher/eslint-plugin-import/compare/v2.17.0...v2.17.1
[2.17.0]: https://github.com/benmosher/eslint-plugin-import/compare/v2.16.0...v2.17.0
[2.16.0]: https://github.com/benmosher/eslint-plugin-import/compare/v2.15.0...v2.16.0
[2.15.0]: https://github.com/benmosher/eslint-plugin-import/compare/v2.14.0...v2.15.0
[2.14.0]: https://github.com/benmosher/eslint-plugin-import/compare/v2.13.0...v2.14.0
[2.13.0]: https://github.com/benmosher/eslint-plugin-import/compare/v2.12.0...v2.13.0
[2.12.0]: https://github.com/benmosher/eslint-plugin-import/compare/v2.11.0...v2.12.0
[2.11.0]: https://github.com/benmosher/eslint-plugin-import/compare/v2.10.0...v2.11.0
[2.10.0]: https://github.com/benmosher/eslint-plugin-import/compare/v2.9.0...v2.10.0
[2.9.0]: https://github.com/benmosher/eslint-plugin-import/compare/v2.8.0...v2.9.0
[2.8.0]: https://github.com/benmosher/eslint-plugin-import/compare/v2.7.0...v2.8.0
[2.7.0]: https://github.com/benmosher/eslint-plugin-import/compare/v2.6.1...v2.7.0
[2.6.1]: https://github.com/benmosher/eslint-plugin-import/compare/v2.6.0...v2.6.1
[2.6.0]: https://github.com/benmosher/eslint-plugin-import/compare/v2.5.0...v2.6.0
[2.5.0]: https://github.com/benmosher/eslint-plugin-import/compare/v2.4.0...v2.5.0
[2.4.0]: https://github.com/benmosher/eslint-plugin-import/compare/v2.3.0...v2.4.0
[2.3.0]: https://github.com/benmosher/eslint-plugin-import/compare/v2.2.0...v2.3.0
[2.2.0]: https://github.com/benmosher/eslint-plugin-import/compare/v2.1.0...v2.2.0
[2.1.0]: https://github.com/benmosher/eslint-plugin-import/compare/v2.0.1...v2.1.0
[2.0.1]: https://github.com/benmosher/eslint-plugin-import/compare/v2.0.0...v2.0.1
[2.0.0]: https://github.com/benmosher/eslint-plugin-import/compare/v1.16.0...v2.0.0
[1.16.0]: https://github.com/benmosher/eslint-plugin-import/compare/v1.15.0...v1.16.0
[1.15.0]: https://github.com/benmosher/eslint-plugin-import/compare/v1.14.0...v1.15.0
[1.14.0]: https://github.com/benmosher/eslint-plugin-import/compare/v1.13.0...v1.14.0
[1.13.0]: https://github.com/benmosher/eslint-plugin-import/compare/v1.12.0...v1.13.0
[1.12.0]: https://github.com/benmosher/eslint-plugin-import/compare/v1.11.1...v1.12.0
[1.11.1]: https://github.com/benmosher/eslint-plugin-import/compare/v1.11.0...v1.11.1
[1.11.0]: https://github.com/benmosher/eslint-plugin-import/compare/v1.10.3...v1.11.0
[1.10.3]: https://github.com/benmosher/eslint-plugin-import/compare/v1.10.2...v1.10.3
[1.10.2]: https://github.com/benmosher/eslint-plugin-import/compare/v1.10.1...v1.10.2
[1.10.1]: https://github.com/benmosher/eslint-plugin-import/compare/v1.10.0...v1.10.1
[1.10.0]: https://github.com/benmosher/eslint-plugin-import/compare/v1.9.2...v1.10.0
[1.9.2]: https://github.com/benmosher/eslint-plugin-import/compare/v1.9.1...v1.9.2
[1.9.1]: https://github.com/benmosher/eslint-plugin-import/compare/v1.9.0...v1.9.1
[1.9.0]: https://github.com/benmosher/eslint-plugin-import/compare/v1.8.1...v1.9.0
[1.8.1]: https://github.com/benmosher/eslint-plugin-import/compare/v1.8.0...v1.8.1
[1.8.0]: https://github.com/benmosher/eslint-plugin-import/compare/v1.7.0...v1.8.0
[1.7.0]: https://github.com/benmosher/eslint-plugin-import/compare/v1.6.1...v1.7.0
[1.6.1]: https://github.com/benmosher/eslint-plugin-import/compare/v1.6.0...v1.6.1
[1.6.0]: https://github.com/benmosher/eslint-plugin-import/compare/v1.5.0...1.6.0
[1.5.0]: https://github.com/benmosher/eslint-plugin-import/compare/v1.4.0...v1.5.0
[1.4.0]: https://github.com/benmosher/eslint-plugin-import/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/benmosher/eslint-plugin-import/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/benmosher/eslint-plugin-import/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/benmosher/eslint-plugin-import/compare/v1.0.4...v1.1.0
[1.0.4]: https://github.com/benmosher/eslint-plugin-import/compare/v1.0.3...v1.0.4
[1.0.3]: https://github.com/benmosher/eslint-plugin-import/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/benmosher/eslint-plugin-import/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/benmosher/eslint-plugin-import/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/benmosher/eslint-plugin-import/compare/v1.0.0-beta.0...v1.0.0
[1.0.0-beta.0]: https://github.com/benmosher/eslint-plugin-import/compare/v0.13.0...v1.0.0-beta.0
[0.13.0]: https://github.com/benmosher/eslint-plugin-import/compare/v0.12.1...v0.13.0
[0.12.2]: https://github.com/benmosher/eslint-plugin-import/compare/v0.12.1...v0.12.2
[0.12.1]: https://github.com/benmosher/eslint-plugin-import/compare/v0.12.0...v0.12.1
[0.12.0]: https://github.com/benmosher/eslint-plugin-import/compare/v0.11.0...v0.12.0
[0.11.0]: https://github.com/benmosher/eslint-plugin-import/compare/v0.10.1...v0.11.0

[@mathieudutour]: https://github.com/mathieudutour
[@gausie]: https://github.com/gausie
[@singles]: https://github.com/singles
[@jfmengels]: https://github.com/jfmengels
[@lo1tuma]: https://github.com/lo1tuma
[@dmnd]: https://github.com/dmnd
[@lemonmade]: https://github.com/lemonmade
[@jimbolla]: https://github.com/jimbolla
[@jquense]: https://github.com/jquense
[@jonboiser]: https://github.com/jonboiser
[@taion]: https://github.com/taion
[@strawbrary]: https://github.com/strawbrary
[@SimenB]: https://github.com/SimenB
[@josh]: https://github.com/josh
[@borisyankov]: https://github.com/borisyankov
[@gavriguy]: https://github.com/gavriguy
[@jkimbo]: https://github.com/jkimbo
[@le0nik]: https://github.com/le0nik
[@scottnonnenberg]: https://github.com/scottnonnenberg
[@sindresorhus]: https://github.com/sindresorhus
[@ljharb]: https://github.com/ljharb
[@rhettlivingston]: https://github.com/rhettlivingston
[@zloirock]: https://github.com/zloirock
[@rhys-vdw]: https://github.com/rhys-vdw
[@wKich]: https://github.com/wKich
[@tizmagik]: https://github.com/tizmagik
[@knpwrs]: https://github.com/knpwrs
[@spalger]: https://github.com/spalger
[@preco21]: https://github.com/preco21
[@skyrpex]: https://github.com/skyrpex
[@fson]: https://github.com/fson
[@ntdb]: https://github.com/ntdb
[@jakubsta]: https://github.com/jakubsta
[@wtgtybhertgeghgtwtg]: https://github.com/wtgtybhertgeghgtwtg
[@duncanbeevers]: https://github.com/duncanbeevers
[@giodamelio]: https://github.com/giodamelio
[@ntdb]: https://github.com/ntdb
[@ramasilveyra]: https://github.com/ramasilveyra
[@sompylasar]: https://github.com/sompylasar
[@kevin940726]: https://github.com/kevin940726
[@eelyafi]: https://github.com/eelyafi
[@mastilver]: https://github.com/mastilver
[@jseminck]: https://github.com/jseminck
[@laysent]: https://github.com/laysent
[@k15a]: https://github.com/k15a
[@mplewis]: https://github.com/mplewis
[@rosswarren]: https://github.com/rosswarren
[@alexgorbatchev]: https://github.com/alexgorbatchev
[@tihonove]: https://github.com/tihonove
[@robertrossmann]: https://github.com/robertrossmann
[@isiahmeadows]: https://github.com/isiahmeadows
[@graingert]: https://github.com/graingert
[@danny-andrews]: https://github.com/dany-andrews
[@fengkfengk]: https://github.com/fengkfengk
[@futpib]: https://github.com/futpib
[@klimashkin]: https://github.com/klimashkin
[@lukeapage]: https://github.com/lukeapage
[@manovotny]: https://github.com/manovotny
[@mattijsbliek]: https://github.com/mattijsbliek
[@hulkish]: https://github.com/hulkish
[@chrislloyd]: https://github.com/chrislloyd
[@ai]: https://github.com/ai
[@syymza]: https://github.com/syymza
[@justinanastos]: https://github.com/justinanastos
[@1pete]: https://github.com/1pete
[@gajus]: https://github.com/gajus
[@jf248]: https://github.com/jf248
[@aravindet]: https://github.com/aravindet
[@pzhine]: https://github.com/pzhine
[@st-sloth]: https://github.com/st-sloth
[@ljqx]: https://github.com/ljqx
[@kirill-konshin]: https://github.com/kirill-konshin
[@asapach]: https://github.com/asapach
[@sergei-startsev]: https://github.com/sergei-startsev
[@ephys]: https://github.com/ephys
[@lydell]: https://github.com/lydell
[@jeffshaver]: https://github.com/jeffshaver
[@timkraut]: https://github.com/timkraut
[@TakeScoop]: https://github.com/TakeScoop
[@rfermann]: https://github.com/rfermann
[@bradennapier]: https://github.com/bradennapier
[@schmod]: https://github.com/schmod
[@echenley]: https://github.com/echenley
[@vikr01]: https://github.com/vikr01
[@bradzacher]: https://github.com/bradzacher
[@feychenie]: https://github.com/feychenie
[@kiwka]: https://github.com/kiwka
[@loganfsmyth]: https://github.com/loganfsmyth
[@johndevedu]: https://github.com/johndevedu
[@charlessuh]: https://github.com/charlessuh
[@kgregory]: https://github.com/kgregory
[@christophercurrie]: https://github.com/christophercurrie
[@alex-page]: https://github.com/alex-page
[@benmosher]: https://github.com/benmosher
[@fooloomanzoo]: https://github.com/fooloomanzoo
[@sheepsteak]: https://github.com/sheepsteak
[@sharmilajesupaul]: https://github.com/sharmilajesupaul
[@lencioni]: https://github.com/lencioni
[@JounQin]: https://github.com/JounQin
[@atikenny]: https://github.com/atikenny
[@schmidsi]: https://github.com/schmidsi
[@TrevorBurnham]: https://github.com/TrevorBurnham
[@benmunro]: https://github.com/benmunro
[@tihonove]: https://github.com/tihonove
[@brendo]: https://github.com/brendo
[@saschanaz]: https://github.com/saschanaz
[@brettz9]: https://github.com/brettz9
[@Taranys]: https://github.com/Taranys
[@maxmalov]: https://github.com/maxmalov
[@marcusdarmstrong]: https://github.com/marcusdarmstrong
[@Mairu]: https://github.com/Mairu
[@aamulumi]: https://github.com/aamulumi
[@pcorpet]: https://github.com/pcorpet
[@stropho]: https://github.com/stropho
[@luczsoma]: https://github.com/luczsoma
[@christophercurrie]: https://github.com/christophercurrie
[@randallreedjr]: https://github.com/randallreedjr
[@Pessimistress]: https://github.com/Pessimistress
[@stekycz]: https://github.com/stekycz
[@dbrewer5]: https://github.com/dbrewer5
[@rsolomon]: https://github.com/rsolomon
[@joaovieira]: https://github.com/joaovieira
[@ivo-stefchev]: https://github.com/ivo-stefchev
[@skozin]: https://github.com/skozin
[@yordis]: https://github.com/yordis
[@sveyret]: https://github.com/sveyret
[@bmish]: https://github.com/bmish
[@redbugz]: https://github.com/redbugz
[@kentcdodds]: https://github.com/kentcdodds
[@IvanGoncharov]: https://github.com/IvanGoncharov
[@wschurman]: https://github.com/wschurman
[@fisker]: https://github.com/fisker
[@richardxia]: https://github.com/richardxia
[@TheCrueltySage]: https://github.com/TheCrueltySage
[@ernestostifano]: https://github.com/ernestostifano
[@forivall]: https://github.com/forivall
[@xpl]: https://github.com/xpl
[@astorije]: https://github.com/astorije
[@Ephem]: https://github.com/Ephem
[@kmui2]: https://github.com/kmui2
[@arvigeus]: https://github.com/arvigeus
[@atos1990]: https://github.com/atos1990
[@Hypnosphi]: https://github.com/Hypnosphi
[@nickofthyme]: https://github.com/nickofthyme
[@manuth]: https://github.com/manuth
[@julien1619]: https://github.com/julien1619
[@darkartur]: https://github.com/darkartur
[@MikeyBeLike]: https://github.com/MikeyBeLike
[@barbogast]: https://github.com/barbogast
[@adamborowski]: https://github.com/adamborowski
[@adjerbetian]: https://github.com/adjerbetian
[@Maxim-Mazurok]: https://github.com/Maxim-Mazurok
[@malykhinvi]: https://github.com/malykhinvi
[@nicolashenry]: https://github.com/nicolashenry
[@fernandopasik]: https://github.com/fernandopasik
[@taye]: https://github.com/taye
[@AndrewLeedham]: https://github.com/AndrewLeedham
[@be5invis]: https://github.com/be5invis
[@noelebrun]: https://github.com/noelebrun
[@beatrizrezener]: https://github.com/beatrizrezener
[@3nuc]: https://github.com/3nuc
[@foray1010]: https://github.com/foray1010
[@tomprats]: https://github.com/tomprats
[@straub]: https://github.com/straub
[@andreubotella]: https://github.com/andreubotella
[@ExE-Boss]: https://github.com/ExE-Boss
