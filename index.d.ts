import ESLint from 'eslint';

declare const plugin: ESLint.ESLint.Plugin & {
  meta: {
    name: string;
    version: string;
  };
  configs: {
    'recommended': ESLint.Linter.LegacyConfig;
    'errors': ESLint.Linter.LegacyConfig;
    'warnings': ESLint.Linter.LegacyConfig;
    'stage-0': ESLint.Linter.LegacyConfig;
    'react': ESLint.Linter.LegacyConfig;
    'react-native': ESLint.Linter.LegacyConfig;
    'electron': ESLint.Linter.LegacyConfig;
    'typescript': ESLint.Linter.LegacyConfig;
  };
  flatConfigs: {
    'recommended': ESLint.Linter.FlatConfig;
    'errors': ESLint.Linter.FlatConfig;
    'warnings': ESLint.Linter.FlatConfig;
    'stage-0': ESLint.Linter.FlatConfig;
    'react': ESLint.Linter.FlatConfig;
    'react-native': ESLint.Linter.FlatConfig;
    'electron': ESLint.Linter.FlatConfig;
    'typescript': ESLint.Linter.FlatConfig;
  };
  rules: {
    [key: string]: ESLint.Rule.RuleModule;
  };
};

export = plugin;
