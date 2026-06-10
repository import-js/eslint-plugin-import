import fs from 'fs';
import { extname, join, resolve } from 'path';
import isGlob from 'is-glob';
import minimatch from 'minimatch';

const { Minimatch, GLOBSTAR } = minimatch;
const minimatchOpts = { dot: true, matchBase: true };

/**
 * Walk a directory collecting file paths that match the given extensions.
 * Skips node_modules and dot-directories. Recurses unless `recursive` is `false`.
 * @param {string} dir - directory to walk
 * @param {string[]} extensions - list of supported file extensions
 * @param {string[]} results - accumulator for matched file paths
 * @param {boolean} [recursive] - if `false`, do not descend into subdirectories
 * @returns {string[]} list of matched file paths
 */
function walkDirectory(dir, extensions, results, recursive) {
  let names;
  try {
    names = fs.readdirSync(dir);
  } catch (e) {
    return results;
  }

  // strings + per-entry `statSync` to stay compatible with Node >= 4.
  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    if (name[0] === '.' || name === 'node_modules') {
      continue;
    }
    const fullPath = join(dir, name);
    let stat;
    try {
      stat = fs.statSync(fullPath);
    } catch (e) {
      continue;
    }
    if (stat.isDirectory()) {
      if (recursive !== false) {
        walkDirectory(fullPath, extensions, results, recursive);
      }
    } else if (stat.isFile() && extensions.indexOf(extname(fullPath)) > -1) {
      results.push(fullPath);
    }
  }

  return results;
}

/**
 * List files with Node.js fs + minimatch — the last tier of listFilesToProcess,
 * used when neither FileEnumerator nor the legacy APIs are requireable.
 * @param {string[]} src - list of file paths, directories, or glob patterns
 * @param {string[]} extensions - list of supported file extensions
 * @returns {string[]} list of matched file paths
 */
export default function listFilesWithNodeFs(src, extensions) {
  const normalizedExts = extensions.map((ext) => ext.startsWith('.') ? ext : `.${ext}`);
  const results = [];

  src.forEach((pattern) => {
    if (isGlob(pattern)) {
      // Expand braces, then take the base from the parsed pattern's leading
      // literal segments, mirroring how ESLint's FileEnumerator resolves globs.
      minimatch.braceExpand(pattern).forEach((expanded) => {
        const mm = new Minimatch(resolve(expanded), minimatchOpts);
        const segments = mm.set[0] || [];
        const baseParts = [];
        while (baseParts.length < segments.length && typeof segments[baseParts.length] === 'string') {
          baseParts.push(segments[baseParts.length]);
        }
        const base = baseParts.join('/') || '/';
        const globPart = segments.slice(baseParts.length);
        // `src/*.js` stays in `src/`; `src/**/*.js` recurses.
        const recursive = globPart.length > 1 || globPart.indexOf(GLOBSTAR) !== -1;
        const allFiles = walkDirectory(base, normalizedExts, [], recursive);
        allFiles.forEach((file) => {
          if (mm.match(file)) {
            results.push(file);
          }
        });
      });
    } else {
      const resolved = resolve(pattern);
      try {
        const stat = fs.statSync(resolved);
        if (stat.isDirectory()) {
          walkDirectory(resolved, normalizedExts, results);
        } else if (stat.isFile() && normalizedExts.indexOf(extname(resolved)) > -1) {
          results.push(resolved);
        }
      } catch (e) {
        // Path doesn't exist, skip it
      }
    }
  });

  return results;
}
