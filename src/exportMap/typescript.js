import { dirname } from 'path';
import { tsConfigLoader } from 'tsconfig-paths/lib/tsconfig-loader';
import { hashObject } from 'eslint-module-utils/hash';

let ts;
const tsconfigCache = new Map();

// flat config exposes parser options under `languageOptions.parserOptions`; legacy config uses `parserOptions`.
// Resolve the object first (mirroring childContext/scc) so a present-but-falsy `tsconfigRootDir` is preserved.
function getParserOptions(context) {
  return context.parserOptions || context.languageOptions && context.languageOptions.parserOptions;
}

function readTsConfig(context) {
  const parserOptions = getParserOptions(context);
  const tsconfigInfo = tsConfigLoader({
    cwd: parserOptions && parserOptions.tsconfigRootDir || process.cwd(),
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
  const parserOptions = getParserOptions(context);
  const cacheKey = hashObject({
    tsconfigRootDir: parserOptions && parserOptions.tsconfigRootDir,
  }).digest('hex');
  let tsConfig = tsconfigCache.get(cacheKey);
  if (typeof tsConfig === 'undefined') {
    tsConfig = readTsConfig(context);
    tsconfigCache.set(cacheKey, tsConfig);
  }

  return tsConfig && tsConfig.options ? tsConfig.options.esModuleInterop : false;
}
