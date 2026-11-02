import fs from 'fs';
import { extname, join, resolve } from 'path';
import isGlob from 'is-glob';
import { braceExpand, Minimatch, GLOBSTAR } from 'minimatch';

import getFlatConfigIgnores from './flatConfigIgnores';

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
function walkDirectory(dir, extensions, results, recursive, ignores) {
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
      const directoryIgnored = ignores && ignores.isDirectoryIgnored(fullPath);
      if (recursive !== false && !directoryIgnored) {
        walkDirectory(fullPath, extensions, results, recursive, ignores);
      }
    } else if (stat.isFile() && extensions.indexOf(extname(fullPath)) > -1) {
      if (!(ignores && ignores.isFileIgnored(fullPath))) {
        results.push(fullPath);
      }
    }
  }

  return results;
}

/**
 * List files with Node.js fs + minimatch — the last tier of listFilesToProcess,
 * used when neither FileEnumerator nor the legacy APIs are requireable.
 * Honors the flat config's global `ignores` (resolved from `cwd`) so the file set
 * matches what ESLint itself would lint.
 * @param {string[]} src - list of file paths, directories, or glob patterns
 * @param {string[]} extensions - list of supported file extensions
 * @param {string} [cwd] - directory to resolve the flat config (and its ignores) from
 * @returns {string[]} list of matched file paths
 */
export default function listFilesWithNodeFs(src, extensions, cwd) {
  const normalizedExts = extensions.map((ext) => ext.startsWith('.') ? ext : `.${ext}`);
  const ignores = getFlatConfigIgnores(cwd);
  const results = [];

  src.forEach((pattern) => {
    if (isGlob(pattern)) {
      // Expand braces, then take the base from the parsed pattern's leading
      // literal segments, mirroring how ESLint's FileEnumerator resolves globs.
      braceExpand(pattern).forEach((expanded) => {
        // `minimatch` only understands `/` separators; on Windows `resolve` yields `\`,
        // which it would treat as escapes, so normalize before parsing/matching.
        const mm = new Minimatch(resolve(expanded).replace(/\\/g, '/'), minimatchOpts);
        const segments = mm.set[0] || [];
        const baseParts = [];
        while (baseParts.length < segments.length && typeof segments[baseParts.length] === 'string') {
          baseParts.push(segments[baseParts.length]);
        }
        const base = baseParts.join('/') || '/';
        const globPart = segments.slice(baseParts.length);
        // `src/*.js` stays in `src/`; `src/**/*.js` recurses.
        const recursive = globPart.length > 1 || globPart.indexOf(GLOBSTAR) !== -1;
        const allFiles = walkDirectory(base, normalizedExts, [], recursive, ignores);
        allFiles.forEach((file) => {
          // match on a normalized path, but keep the native path in the results.
          if (mm.match(file.replace(/\\/g, '/'))) {
            results.push(file);
          }
        });
      });
    } else {
      const resolved = resolve(pattern);
      try {
        const stat = fs.statSync(resolved);
        if (stat.isDirectory()) {
          walkDirectory(resolved, normalizedExts, results, true, ignores);
        } else if (stat.isFile() && normalizedExts.indexOf(extname(resolved)) > -1) {
          if (!(ignores && ignores.isFileIgnored(resolved))) {
            results.push(resolved);
          }
        }
      } catch (e) {
        // Path doesn't exist, skip it
      }
    }
  });

  return results;
}
