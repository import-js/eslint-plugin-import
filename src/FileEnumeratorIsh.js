const fs = require("fs");
const path = require("path");
const escapeRegExp = require("escape-string-regexp");

const dotfilesPattern = /(?:(?:^\.)|(?:[/\\]\.))[^/\\.].*/u;
const NONE = 0;
const IGNORED_SILENTLY = 1;

/**
 * @typedef {Object} FileEnumeratorOptions
 * @property {CascadingConfigArrayFactory} [configArrayFactory] The factory for config arrays.
 * @property {string} [cwd] The base directory to start lookup.
 * @property {string[]} [extensions] The extensions to match files for directory patterns.
 * @property {(directoryPath: string) => boolean} [isDirectoryIgnored] Returns whether a directory is ignored.
 * @property {(filePath: string) => boolean} [isFileIgnored] Returns whether a file is ignored.
 */

/**
 * @typedef {Object} FileAndIgnored
 * @property {string} filePath The path to a target file.
 * @property {boolean} ignored If `true` then this file should be ignored and warned because it was directly specified.
 */

/**
 * @typedef {Object} FileEntry
 * @property {string} filePath The path to a target file.
 * @property {ConfigArray} config The config entries of that file.
 * @property {NONE|IGNORED_SILENTLY} flag The flag.
 * - `NONE` means the file is a target file.
 * - `IGNORED_SILENTLY` means the file should be ignored silently.
 */

/**
 * Get stats of a given path.
 * @param {string} filePath The path to target file.
 * @throws {Error} As may be thrown by `fs.statSync`.
 * @returns {fs.Stats|null} The stats.
 * @private
 */
function statSafeSync(filePath) {
  try {
    return fs.statSync(filePath);
  } catch (error) {
    /* c8 ignore next */
    if (error.code !== "ENOENT") {
      throw error;
    }
    return null;
  }
}

/**
 * Get filenames in a given path to a directory.
 * @param {string} directoryPath The path to target directory.
 * @throws {Error} As may be thrown by `fs.readdirSync`.
 * @returns {import("fs").Dirent[]} The filenames.
 * @private
 */
function readdirSafeSync(directoryPath) {
  try {
    return fs.readdirSync(directoryPath, { withFileTypes: true });
  } catch (error) {
    /* c8 ignore next */
    if (error.code !== "ENOENT") {
      throw error;
    }
    return [];
  }
}

/**
 * Create a `RegExp` object to detect extensions.
 * @param {string[] | null} extensions The extensions to create.
 * @returns {RegExp | null} The created `RegExp` object or null.
 */
function createExtensionRegExp(extensions) {
  if (extensions) {
    const normalizedExts = extensions.map((ext) =>
      escapeRegExp(ext.startsWith(".") ? ext.slice(1) : ext)
    );

    return new RegExp(`.\\.(?:${normalizedExts.join("|")})$`, "u");
  }
  return null;
}

/**
 * This class provides the functionality that enumerates every file which is
 * matched by given glob patterns and that configuration.
 */
export class FileEnumeratorIsh {
  /**
   * Initialize this enumerator.
   * @param {FileEnumeratorOptions} options The options.
   */
  constructor({
    cwd = process.cwd(),
    extensions = null,
    isDirectoryIgnored,
    isFileIgnored,
  } = {}) {
    this.cwd = cwd;
    this.extensionRegExp = createExtensionRegExp(extensions);
    this.isDirectoryIgnored = isDirectoryIgnored;
    this.isFileIgnored = isFileIgnored;
  }

  /**
   * Iterate files which are matched by given glob patterns.
   * @param {string|string[]} patternOrPatterns The glob patterns to iterate files.
   * @returns {IterableIterator<FileAndIgnored>} The found files.
   */
  *iterateFiles(patternOrPatterns) {
    const patterns = Array.isArray(patternOrPatterns)
      ? patternOrPatterns
      : [patternOrPatterns];

    // The set of paths to remove duplicate.
    const set = new Set();

    for (const pattern of patterns) {
      // Skip empty string.
      if (!pattern) {
        continue;
      }

      // Iterate files of this pattern.
      for (const { filePath, flag } of this._iterateFiles(pattern)) {
        if (flag === IGNORED_SILENTLY) {
          continue;
        }

        // Remove duplicate paths while yielding paths.
        if (!set.has(filePath)) {
          set.add(filePath);
          yield {
            filePath,
            ignored: false,
          };
        }
      }
    }
  }

  /**
   * Iterate files which are matched by a given glob pattern.
   * @param {string} pattern The glob pattern to iterate files.
   * @returns {IterableIterator<FileEntry>} The found files.
   */
  _iterateFiles(pattern) {
    const { cwd } = this;
    const absolutePath = path.resolve(cwd, pattern);
    const isDot = dotfilesPattern.test(pattern);
    const stat = statSafeSync(absolutePath);

    if (!stat) {
      return [];
    }

    if (stat.isDirectory()) {
      return this._iterateFilesWithDirectory(absolutePath, isDot);
    }

    if (stat.isFile()) {
      return this._iterateFilesWithFile(absolutePath);
    }
  }

  /**
   * Iterate files in a given path.
   * @param {string} directoryPath The path to the target directory.
   * @param {boolean} dotfiles If `true` then it doesn't skip dot files by default.
   * @returns {IterableIterator<FileEntry>} The found files.
   * @private
   */
  _iterateFilesWithDirectory(directoryPath, dotfiles) {
    return this._iterateFilesRecursive(directoryPath, { dotfiles });
  }

  /**
   * Iterate files in a given path.
   * @param {string} directoryPath The path to the target directory.
   * @param {Object} options The options to iterate files.
   * @param {boolean} [options.dotfiles] If `true` then it doesn't skip dot files by default.
   * @param {boolean} [options.recursive] If `true` then it dives into sub directories.
   * @returns {IterableIterator<FileEntry>} The found files.
   * @private
   */
  *_iterateFilesRecursive(directoryPath, options) {
    // Enumerate the files of this directory.
    for (const entry of readdirSafeSync(directoryPath)) {
      const filePath = path.join(directoryPath, entry.name);
      const fileInfo = entry.isSymbolicLink() ? statSafeSync(filePath) : entry;

      if (!fileInfo) {
        continue;
      }

      // Check if the file is matched.
      if (fileInfo.isFile()) {
        if (this.extensionRegExp.test(filePath)) {
          const ignored = this.isFileIgnored(filePath, options.dotfiles);
          const flag = ignored ? IGNORED_SILENTLY : NONE;

          yield { filePath, flag };
        }

        // Dive into the sub directory.
      } else if (fileInfo.isDirectory()) {
        const ignored = this.isDirectoryIgnored(
          filePath + path.sep,
          options.dotfiles
        );

        if (!ignored) {
          yield* this._iterateFilesRecursive(filePath, options);
        }
      }
    }
  }
}
