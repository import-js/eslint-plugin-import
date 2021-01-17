import path from 'path';
import copyFileSync from 'fs-copy-file-sync';
import resolverDirectories from './resolverDirectories';

let files = [
    'LICENSE',
    '.npmrc',
];

let directories = [
    'memo-parser',
    ...resolverDirectories,
    'utils',
];

for (let directory of directories) {
    for (let file of files) {
        let destination = path.join(directory, file);
        copyFileSync(file, destination);
        console.log(`${file} -> ${destination}`);
    }
}
