import { dirname } from 'path';
import { getPhysicalFilename } from 'eslint-module-utils/contextCompat';
import pkgUp from 'eslint-module-utils/pkgUp';
import readPkgUp from 'eslint-module-utils/readPkgUp';

export function getFilePackagePath(filePath) {
  const fp = pkgUp({ cwd: filePath });
  return dirname(fp);
}

export function getContextPackagePath(context) {
  return getFilePackagePath(getPhysicalFilename(context));
}

export function getFilePackageName(filePath) {
  const { pkg, path } = readPkgUp({ cwd: filePath, normalize: false });
  if (pkg) {
    // recursion in case of intermediate esm package.json without name found
    return pkg.name || getFilePackageName(dirname(dirname(path)));
  }
  return null;
}
