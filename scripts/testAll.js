import { spawnSync } from 'child_process';
import npmWhich from 'npm-which';
import resolverDirectories from './resolverDirectories';

const npmPath = npmWhich(__dirname).sync('npm');
const spawnOptions = {
  stdio: 'inherit',
};

spawnSync(
  npmPath,
  ['test'],
  { cwd: __dirname, ...spawnOptions });

for (const resolverDir of resolverDirectories) {
  spawnSync(
    npmPath,
    ['test'],
    { cwd: resolverDir, ...spawnOptions });
}
