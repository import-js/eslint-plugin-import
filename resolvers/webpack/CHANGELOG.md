# Change Log
All notable changes to this resolver will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).
This change log adheres to standards from [Keep a CHANGELOG](http://keepachangelog.com).

## Unreleased
### Changed
- use `enhanced-resolve` to support additional plugins instead of re-implementing
  aliases, etc.

## 0.2.5 - 2016-05-23
### Added
- Added support for multiple webpack configs ([#181], thanks [@GreenGremlin])

## 0.2.4 - 2016-04-29
### Changed
- automatically find webpack config with `interpret`-able extensions ([#287], thanks [@taion])

## 0.2.3 - 2016-04-28
### Fixed
- `interpret` dependency was declared in the wrong `package.json`.
   Thanks [@jonboiser] for sleuthing ([#286]) and fixing ([#289]).

## 0.2.2 - 2016-04-27
### Added
- `interpret` configs (such as `.babel.js`).
  Thanks to [@gausie] for the initial PR ([#164], ages ago! 😅) and [@jquense] for tests ([#278]).

[#289]: https://github.com/benmosher/eslint-plugin-import/pull/289
[#287]: https://github.com/benmosher/eslint-plugin-import/pull/287
[#278]: https://github.com/benmosher/eslint-plugin-import/pull/278
[#181]: https://github.com/benmosher/eslint-plugin-import/pull/181
[#164]: https://github.com/benmosher/eslint-plugin-import/pull/164

[#286]: https://github.com/benmosher/eslint-plugin-import/issues/286

[@gausie]: https://github.com/gausie
[@jquense]: https://github.com/jquense
[@taion]: https://github.com/taion
[@GreenGremlin]: https://github.com/GreenGremlin
