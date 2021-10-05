'use strict';
exports.__esModule = true;

const extname = require('path').extname;

const log = require('debug')('eslint-plugin-import:utils:ignore');

// one-shot memoized
let cachedSet; let lastSettings;
function validExtensions(context) {
  if (cachedSet && context.settings === lastSettings) {
    return cachedSet;
  }

  lastSettings = context.settings;
  cachedSet = makeValidExtensionSet(context.settings);
  return cachedSet;
}

function makeValidExtensionSet(settings) {
  // start with explicit JS-parsed extensions
  const exts = new Set(settings['import/extensions'] || [ '.js' ]);

  // all alternate parser extensions are also valid
  if ('import/parsers' in settings) {
    for (const parser in settings['import/parsers']) {
      const parserSettings = settings['import/parsers'][parser];
      if (!Array.isArray(parserSettings)) {
        throw new TypeError('"settings" for ' + parser + ' must be an array');
      }
      parserSettings.forEach(ext => exts.add(ext));
    }
  }

  return exts;
}
exports.getFileExtensions = makeValidExtensionSet;

let cachedRegexps;
function getIgnoreRegexps(context) {
  if (cachedRegexps && context.settings === lastSettings) {
    return cachedRegexps;
  }

  lastSettings = context.settings;
  cachedRegexps = context.settings['import/ignore'].map(p => new RegExp(p));

  return cachedRegexps;
}

exports.default = function ignore(path, context) {
  // check extension whitelist first (cheap)
  if (!hasValidExtension(path, context)) return true;

  if (!('import/ignore' in context.settings)) return false;

  const ignores = getIgnoreRegexps(context);

  for (let i = 0; i < ignores.length; i++) {
    if (ignores[i].test(path)) {
      log(`ignoring ${path}, matched pattern /${ignores[i].source}/`);
      return true;
    }
  }

  return false;
};

function hasValidExtension(path, context) {
  const ext = extname(path);
  return !ext || validExtensions(context).has(ext);
}
exports.hasValidExtension = hasValidExtension;
