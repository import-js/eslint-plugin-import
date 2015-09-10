export const rules = {
  'no-unresolved': require('./rules/no-unresolved')
, 'named': require('./rules/named')
, 'default': require('./rules/default')
, 'namespace': require('./rules/namespace')
, 'no-named-as-default': require('./rules/no-named-as-default')

, 'no-errors': require('./rules/no-errors')
, 'no-require': require('./rules/no-require')

, 'export': require('./rules/export')

, 'no-duplicates': require('./rules/no-duplicates')
, 'imports-first': require('./rules/imports-first')

  // removed
, 'no-reassign': function () { return {} }
  // should remove this undocumented alias
, 'exists': require('./rules/no-unresolved')
}

export const rulesConfig = {
  'no-unresolved': 2
, 'named': 2
, 'namespace': 2
, 'default': 2
, 'no-named-as-default': 2
, 'export': 2

  // warnings
, 'no-duplicates': 1

  // optional
, 'imports-first': 0
, 'no-errors': 0
, 'no-require': 0

  // removed
, 'no-reassign': 0
}
