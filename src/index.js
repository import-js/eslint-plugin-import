export const rules = {
  'no-unresolved': require('./rules/no-unresolved'),
  'named': require('./rules/named'),
  'default': require('./rules/default'),
  'namespace': require('./rules/namespace'),
  'export': require('./rules/export'),

  'no-named-as-default': require('./rules/no-named-as-default'),

  'no-commonjs': require('./rules/no-commonjs'),
  'no-amd': require('./rules/no-amd'),
  'no-duplicates': require('./rules/no-duplicates'),
  'imports-first': require('./rules/imports-first'),

  // metadata-based
  'no-deprecated': require('./rules/no-deprecated'),
}

export const configs = {
  'errors': require('../config/errors'),
  'warnings': require('../config/warnings'),
}
