// Type tests for the root `index.d.ts` (see #3169).
// Compiled by `npm run test-types` via `tests/types/tsconfig.json`;
// never executed at runtime.

import importPlugin from 'eslint-plugin-import';
import { ESLint, Linter, Rule } from 'eslint';

type IsAny<T> = 0 extends 1 & T ? true : false;
type NoAnyValues<T> = { [K in keyof T]: IsAny<T[K]> };

// the plugin object itself is a usable, fully-typed ESLint plugin
const plugin: ESLint.Plugin = importPlugin;

// the plugin exports its metadata at the top level
const meta: { name: string, version: string } = importPlugin.meta;

// `flatConfigs`/`configs` and every one of their entries must not be optional or `any` (#3169)
const flatConfigsNotAny: IsAny<typeof importPlugin.flatConfigs> = false;
const flatConfigEntriesNotAny: NoAnyValues<typeof importPlugin.flatConfigs> extends Record<string, false> ? true : false = true;
const configEntriesNotAny: NoAnyValues<typeof importPlugin.configs> extends Record<string, false> ? true : false = true;

// every flat config exported by the runtime module is a defined `Linter.FlatConfig`
const flatConfigs: Linter.FlatConfig[] = [
  importPlugin.flatConfigs.recommended,
  importPlugin.flatConfigs.errors,
  importPlugin.flatConfigs.warnings,
  importPlugin.flatConfigs.react,
  importPlugin.flatConfigs['react-native'],
  importPlugin.flatConfigs.electron,
  importPlugin.flatConfigs.typescript,
];

// @ts-expect-error `stage-0` only exists in the legacy `configs`, not in `flatConfigs`
importPlugin.flatConfigs['stage-0'];

// the legacy configs are eslintrc-style configs, including `stage-0`
const legacyConfigs: Linter.LegacyConfig[] = [
  importPlugin.configs.recommended,
  importPlugin.configs.errors,
  importPlugin.configs.warnings,
  importPlugin.configs['stage-0'],
  importPlugin.configs.react,
  importPlugin.configs['react-native'],
  importPlugin.configs.electron,
  importPlugin.configs.typescript,
];

// rule modules are fully typed
// (`rules` is an index signature, so this does not pin that any particular rule exists)
const orderRule: Rule.RuleModule = importPlugin.rules.order;
