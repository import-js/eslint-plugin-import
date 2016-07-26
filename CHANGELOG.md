# Change Log
All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).
This change log adheres to standards from [Keep a CHANGELOG](http://keepachangelog.com).

## [Unreleased]

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
- [`import/extensions` setting]: a whitelist of file extensions to parse as modules
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
Thanks @lencioni for identifying a huge amount of rework in resolve and kicking
off a bunch of memoization.

I'm seeing 62% improvement over my normal test codebase when executing only
[`no-unresolved`] in isolation, and ~35% total reduction in lint time.

### Changed
- added caching to core/resolve via [#214], configured via [`import/cache` setting]

## [1.1.0] - 2016-03-15
### Added
- Added an [`ignore`](./docs/rules/no-unresolved.md#ignore) option to [`no-unresolved`] for those pesky files that no
resolver can find. (still prefer enhancing the Webpack and Node resolvers to
using it, though). See [#89] for details.

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
- [`namespace`] no longer flags modules with only a default export as having no
names. (ns.default is valid ES6)

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
- [`no-deprecated`]: WIP rule to let you know at lint time if you're using
deprecated functions, constants, classes, or modules.

### Changed
- [`namespace`]: support deep namespaces ([#119] via [#157])

## [1.0.0-beta.0] - 2016-02-13
### Changed
- support for (only) ESLint 2.x
- no longer needs/refers to `import/parser` or `import/parse-options`. Instead,
ESLint provides the configured parser + options to the rules, and they use that
to parse dependencies.

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
- Ignore [`import/ignore` setting] if exports are actually found in the parsed module. Does
this to support use of `jsnext:main` in `node_modules` without the pain of
managing a whitelist or a nuanced blacklist.

## [0.11.0] - 2015-11-27
### Added
- Resolver plugins. Now the linter can read Webpack config, properly follow
aliases and ignore externals, dismisses inline loaders, etc. etc.!

## Earlier releases (0.10.1 and younger)
See [GitHub release notes](https://github.com/benmosher/eslint-plugin-import/releases?after=v0.11.0)
for info on changes for earlier releases.


[`import/cache` setting]: ./README.md#importcache
[`import/ignore` setting]: ./README.md#importignore
[`import/extensions` setting]: ./README.md#importextensions
[`import/core-modules` setting]: ./README.md#importcore-modules
[`import/external-module-folders` setting]: ./README.md#importexternal-module-folders

[`no-unresolved`]: ./docs/rules/no-unresolved.md
[`no-deprecated`]: ./docs/rules/no-deprecated.md
[`no-commonjs`]: ./docs/rules/no-commonjs.md
[`no-amd`]: ./docs/rules/no-amd.md
[`namespace`]: ./docs/rules/namespace.md
[`no-namespace`]: ./docs/rules/no-namespace.md
[`no-named-as-default-member`]: ./docs/rules/no-named-as-default-member.md
[`no-extraneous-dependencies`]: ./docs/rules/no-extraneous-dependencies.md
[`extensions`]: ./docs/rules/extensions.md
[`imports-first`]: ./docs/rules/imports-first.md
[`no-nodejs-modules`]: ./docs/rules/no-nodejs-modules.md
[`order`]: ./docs/rules/order.md
[`named`]: ./docs/rules/named.md
[`default`]: ./docs/rules/default.md
[`export`]: ./docs/rules/export.md
[`newline-after-import`]: ./docs/rules/newline-after-import.md
[`no-mutable-exports`]: ./docs/rules/no-mutable-exports.md
[`prefer-default-export`]: ./docs/rules/prefer-default-export.md
[`no-restricted-paths`]: ./docs/rules/no-restricted-paths.md

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
[#314]: https://github.com/benmosher/eslint-plugin-import/pull/314

[#441]: https://github.com/benmosher/eslint-plugin-import/issues/441
[#423]: https://github.com/benmosher/eslint-plugin-import/issues/423
[#415]: https://github.com/benmosher/eslint-plugin-import/issues/415
[#386]: https://github.com/benmosher/eslint-plugin-import/issues/386
[#373]: https://github.com/benmosher/eslint-plugin-import/issues/373
[#370]: https://github.com/benmosher/eslint-plugin-import/issues/370
[#348]: https://github.com/benmosher/eslint-plugin-import/issues/348
[#342]: https://github.com/benmosher/eslint-plugin-import/issues/342
[#328]: https://github.com/benmosher/eslint-plugin-import/issues/328
[#317]: https://github.com/benmosher/eslint-plugin-import/issues/317
[#313]: https://github.com/benmosher/eslint-plugin-import/issues/313
[#286]: https://github.com/benmosher/eslint-plugin-import/issues/286
[#283]: https://github.com/benmosher/eslint-plugin-import/issues/283
[#281]: https://github.com/benmosher/eslint-plugin-import/issues/281
[#275]: https://github.com/benmosher/eslint-plugin-import/issues/275
[#272]: https://github.com/benmosher/eslint-plugin-import/issues/272
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

[Unreleased]: https://github.com/benmosher/eslint-plugin-import/compare/v1.12.0...HEAD
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
