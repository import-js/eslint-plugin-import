import flatMap from 'array.prototype.flatmap';

import listFilesWithNodeFs from './listFilesWithNodeFs';

/**
 * Attempt to load the internal `FileEnumerator` class, which has existed in a couple
 * of different places, depending on the version of `eslint`.  Try requiring it from both
 * locations.
 * @returns Returns the `FileEnumerator` class if its requirable, otherwise `undefined`.
 */
function requireFileEnumerator() {
  let FileEnumerator;

  // Try getting it from the eslint private / deprecated api
  try {
    ({ FileEnumerator } = require('eslint/use-at-your-own-risk'));
  } catch (e) {
    // Absorb this if it's MODULE_NOT_FOUND
    if (e.code !== 'MODULE_NOT_FOUND') {
      throw e;
    }

    // If not there, then try getting it from eslint/lib/cli-engine/file-enumerator (moved there in v6)
    try {
      ({ FileEnumerator } = require('eslint/lib/cli-engine/file-enumerator'));
    } catch (e) {
      // Absorb this if it's MODULE_NOT_FOUND
      if (e.code !== 'MODULE_NOT_FOUND') {
        throw e;
      }
    }
  }
  return FileEnumerator;
}

/**
 * Given a FileEnumerator class, instantiate and load the list of files.
 * @param FileEnumerator the `FileEnumerator` class from `eslint`'s internal api
 * @param {string} src path to the src root
 * @param {string[]} extensions list of supported extensions
 * @returns {{ filename: string, ignored: boolean }[]} list of files to operate on
 */
export function listFilesUsingFileEnumerator(FileEnumerator, src, extensions) {
  // We need to know whether this is being run with flat config in order to
  // determine how to report errors if FileEnumerator throws due to a lack of eslintrc.

  const { ESLINT_USE_FLAT_CONFIG } = process.env;

  // This condition is sufficient to test in v8, since the environment variable is necessary to turn on flat config
  let isUsingFlatConfig = ESLINT_USE_FLAT_CONFIG && process.env.ESLINT_USE_FLAT_CONFIG !== 'false';

  // In the case of using v9, we can check the `shouldUseFlatConfig` function
  // If this function is present, then we assume it's v9
  try {
    const { shouldUseFlatConfig } = require('eslint/use-at-your-own-risk');
    isUsingFlatConfig = shouldUseFlatConfig && ESLINT_USE_FLAT_CONFIG !== 'false';
  } catch (_) {
    // We don't want to throw here, since we only want to update the
    // boolean if the function is available.
  }

  const enumerator = new FileEnumerator({
    extensions,
  });

  try {
    return Array.from(
      enumerator.iterateFiles(src),
      ({ filePath, ignored }) => ({ filename: filePath, ignored }),
    );
  } catch (e) {
    // #3079: flat config without .eslintrc — use the `listFilesWithNodeFs` fallback.
    if (
      isUsingFlatConfig
      && e.message.includes('No ESLint configuration found')
    ) {
      return listFilesWithNodeFs(src, extensions);
    }
    throw e;
  }
}

/**
 * Attempt to require old versions of the file enumeration capability from v6 `eslint` and earlier, and use
 * those functions to provide the list of files to operate on
 * @param {string} src path to the src root
 * @param {string[]} extensions list of supported extensions
 * @returns {string[]} list of files to operate on
 */
function listFilesWithLegacyFunctions(src, extensions) {
  try {
    // eslint/lib/util/glob-util has been moved to eslint/lib/util/glob-utils with version 5.3
    const { listFilesToProcess: originalListFilesToProcess } = require('eslint/lib/util/glob-utils');
    // Prevent passing invalid options (extensions array) to old versions of the function.
    // https://github.com/eslint/eslint/blob/v5.16.0/lib/util/glob-utils.js#L178-L280
    // https://github.com/eslint/eslint/blob/v5.2.0/lib/util/glob-util.js#L174-L269

    return originalListFilesToProcess(src, {
      extensions,
    });
  } catch (e) {
    // Absorb this if it's MODULE_NOT_FOUND
    if (e.code !== 'MODULE_NOT_FOUND') {
      throw e;
    }

    // Last place to try (pre v5.3)
    const {
      listFilesToProcess: originalListFilesToProcess,
    } = require('eslint/lib/util/glob-util');
    const patterns = src.concat(
      flatMap(
        src,
        (pattern) => extensions.map((extension) => (/\*\*|\*\./).test(pattern) ? pattern : `${pattern}/**/*${extension}`),
      ),
    );

    return originalListFilesToProcess(patterns);
  }
}

/**
 * Given a src pattern and list of supported extensions, return a list of files to process
 * with this rule.
 * @param {string} src - file, directory, or glob pattern of files to act on
 * @param {string[]} extensions - list of supported file extensions
 * @returns {string[] | { filename: string, ignored: boolean }[]} the list of files that this rule will evaluate.
 */
export default function listFilesToProcess(src, extensions) {
  const FileEnumerator = requireFileEnumerator();

  // If we got the FileEnumerator, then let's go with that
  if (FileEnumerator) {
    return listFilesUsingFileEnumerator(FileEnumerator, src, extensions);
  }
  // If not, then we can try even older versions of this capability (listFilesToProcess)
  return listFilesWithLegacyFunctions(src, extensions);
}
