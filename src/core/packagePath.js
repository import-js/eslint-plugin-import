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
  const { pkg } = readPkgUp.sync({ cwd: filePath, normalize: false });
  return pkg && pkg.name;
}
