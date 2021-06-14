import { dirname } from 'path';
import findUp from 'find-up';
import readPkgUp from 'read-pkg-up';


export function getContextPackagePath(context) {
  return getFilePackagePath(context.getFilename());
}

export function getFilePackagePath(filePath) {
  const fp = findUp.sync('package.json', { cwd: filePath });
  return dirname(fp);
}

export function getFilePackageName(filePath) {
  const { pkg, path } = readPkgUp.sync({ cwd: filePath, normalize: false });
  if (pkg) {
    // recursion in case of intermediate esm package.json without name found
    return pkg.name || getFilePackageName(dirname(dirname(path)));
  }
  return null;
}
