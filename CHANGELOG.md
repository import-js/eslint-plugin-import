# Change Log
All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).
This change log adheres to standards from [Keep a CHANGELOG](http://keepachangelog.com).

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
- correct cache behavior in `eslint_d` for deep namespaces (#200)

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

[`no-unresolved`]: ./docs/rules/no-unresolved.md
[`no-deprecated`]: ./docs/rules/no-deprecated.md
[`no-commonjs`]: ./docs/rules/no-commonjs.md
[`no-amd`]: ./docs/rules/no-amd.md
[`namespace`]: ./docs/rules/namespace.md

[#228]: https://github.com/benmosher/eslint-plugin-import/pull/228
[#211]: https://github.com/benmosher/eslint-plugin-import/pull/211
[#157]: https://github.com/benmosher/eslint-plugin-import/pull/157

[#216]: https://github.com/benmosher/eslint-plugin-import/issues/216
[#214]: https://github.com/benmosher/eslint-plugin-import/issues/214
[#210]: https://github.com/benmosher/eslint-plugin-import/issues/210
[#200]: https://github.com/benmosher/eslint-plugin-import/issues/200
[#192]: https://github.com/benmosher/eslint-plugin-import/issues/192
[#191]: https://github.com/benmosher/eslint-plugin-import/issues/191
[#189]: https://github.com/benmosher/eslint-plugin-import/issues/189
[#170]: https://github.com/benmosher/eslint-plugin-import/issues/170
[#119]: https://github.com/benmosher/eslint-plugin-import/issues/119
[#89]: https://github.com/benmosher/eslint-plugin-import/issues/89

[Unreleased]: https://github.com/benmosher/eslint-plugin-import/compare/v1.4.0...HEAD
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
