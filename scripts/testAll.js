import { spawnSync } from 'child_process'
import npmWhich from 'npm-which'
import resolverDirectories from './resolverDirectories'

let npmPath = npmWhich(__dirname).sync('npm')
let spawnOptions = {
    stdio: 'inherit',
}

spawnSync(
    npmPath,
    ['test'],
    Object.assign({ cwd: __dirname }, spawnOptions))

for (let resolverDir of resolverDirectories) {
    spawnSync(
        npmPath,
        ['test'],
        Object.assign({ cwd: resolverDir }, spawnOptions))
}
