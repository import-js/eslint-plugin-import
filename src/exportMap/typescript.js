import { dirname } from 'path';
import { tsConfigLoader } from 'tsconfig-paths/lib/tsconfig-loader';
import { hashObject } from 'eslint-module-utils/hash';

let ts;
const tsconfigCache = new Map();

function readTsConfig(context) {
  const tsconfigInfo = tsConfigLoader({
    cwd: context.parserOptions && context.parserOptions.tsconfigRootDir || process.cwd(),
    getEnv: (key) => process.env[key],
  });
  try {
    if (tsconfigInfo.tsConfigPath !== undefined) {
      // Projects not using TypeScript won't have `typescript` installed.
      if (!ts) { ts = require('typescript'); } // eslint-disable-line import/no-extraneous-dependencies

      const configFile = ts.readConfigFile(tsconfigInfo.tsConfigPath, ts.sys.readFile);
      return ts.parseJsonConfigFileContent(
        configFile.config,
        ts.sys,
        dirname(tsconfigInfo.tsConfigPath),
      );
    }
  } catch (e) {
    // Catch any errors
  }

  return null;
}

export function isEsModuleInterop(context) {
  const cacheKey = hashObject({
    tsconfigRootDir: context.parserOptions && context.parserOptions.tsconfigRootDir,
  }).digest('hex');
  let tsConfig = tsconfigCache.get(cacheKey);
  if (typeof tsConfig === 'undefined') {
    tsConfig = readTsConfig(context);
    tsconfigCache.set(cacheKey, tsConfig);
  }

  return tsConfig && tsConfig.options ? tsConfig.options.esModuleInterop : false;
}
