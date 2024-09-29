import path from 'path';
import copyFileSync from 'fs-copy-file-sync';
import resolverDirectories from './resolverDirectories';

const files = [
  'LICENSE',
  '.npmrc',
];

const directories = [].concat(
  'memo-parser',
  resolverDirectories,
  'utils',
);

for (const directory of directories) {
  for (const file of files) {
    const destination = path.join(directory, file);
    copyFileSync(file, destination);
    console.log(`${file} -> ${destination}`);
  }
}
