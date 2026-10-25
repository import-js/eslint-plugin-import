import { hashObject } from 'eslint-module-utils/hash';

let optionsHash = '';
let prevOptions = '';
let settingsHash = '';
let prevSettings = '';

/**
 * don't hold full context object in memory, just grab what we need.
 * also calculate a cacheKey, where parts of the cacheKey hash are memoized
 */
export default function childContext(path, context) {
  const { settings, parserOptions, parserPath, languageOptions } = context;

  // ESLint reuses these objects across files: flat config shares settings and languageOptions
  // between files that match the same config blocks, and eslintrc shares settings and rebuilds
  // parserOptions per file. Comparing references skips serializing them on every lookup, and
  // assumes nothing mutates them in place during a lint run.
  if (settings !== prevSettings) {
    settingsHash = hashObject({ settings }).digest('hex');
    prevSettings = settings;
  }

  // We'll use either a combination of `parserOptions` and `parserPath` or `languageOptions`
  // to construct the cache key, depending on whether this is using a flat config or not.
  let optionsToken;
  if (!parserPath && languageOptions) {
    if (languageOptions !== prevOptions) {
      optionsHash = hashObject({ languageOptions }).digest('hex');
      prevOptions = languageOptions;
    }
    // For languageOptions, we're just using the hashed options as the options token
    optionsToken = optionsHash;
  } else {
    if (parserOptions !== prevOptions) {
      optionsHash = hashObject({ parserOptions }).digest('hex');
      prevOptions = parserOptions;
    }
    // When not using flat config, we use a combination of the hashed parserOptions
    // and parserPath as the token
    optionsToken = String(parserPath) + optionsHash;
  }

  return {
    cacheKey: optionsToken + settingsHash + String(path),
    settings,
    parserOptions: parserOptions || languageOptions && languageOptions.parserOptions,
    parserPath,
    path,
    languageOptions,
  };
}
