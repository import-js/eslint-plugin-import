/**
 * This is intended to provide similar capability as the sync api from @nodelib/fs.walk, until `eslint-plugin-import`
 * is willing to modernize and update their minimum node version to at least v16.  I intentionally made the
 * shape of the API (for the part we're using) the same as @nodelib/fs.walk so that that can be swapped in
 * when the repo is ready for it.
 */

import path from 'path';
import { readdirSync } from 'fs';

/** @typedef {{ name: string, path: string, dirent: import('fs').Dirent }} Entry */

/**
 * Do a comprehensive walk of the provided src directory, and collect all entries.  Filter out
 * any directories or entries using the optional filter functions.
 * @param {string} root - path to the root of the folder we're walking
 * @param {{ deepFilter?: (entry: Entry) => boolean, entryFilter?: (entry: Entry) => boolean }} options
 * @param {Entry} currentEntry - entry for the current directory we're working in
 * @param {Entry[]} existingEntries - list of all entries so far
 * @returns {Entry[]} an array of directory entries
 */
export function walkSync(root, options, currentEntry, existingEntries) {
  // Extract the filter functions. Default to evaluating true, if no filter passed in.
  const { deepFilter = () => true, entryFilter = () => true } = options;

  let entryList = existingEntries || [];
  const currentRelativePath = currentEntry ? currentEntry.path : '.';
  const fullPath = currentEntry ? path.join(root, currentEntry.path) : root;

  const dirents = readdirSync(fullPath, { withFileTypes: true });
  dirents.forEach((dirent) => {
    /** @type {Entry} */
    const entry = {
      name: dirent.name,
      path: path.join(currentRelativePath, dirent.name),
      dirent,
    };

    if (dirent.isDirectory() && deepFilter(entry)) {
      entryList.push(entry);
      entryList = walkSync(root, options, entry, entryList);
    } else if (dirent.isFile() && entryFilter(entry)) {
      entryList.push(entry);
    }
  });

  return entryList;
}
