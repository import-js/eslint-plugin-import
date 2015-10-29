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
}

export const rulesConfig = {

  'no-unresolved': 0
, 'named': 0
, 'namespace': 0
, 'default': 0
, 'export': 0
, 'no-named-as-default': 0
, 'no-duplicates': 0
, 'imports-first': 0
, 'no-require': 0

  // basically just a debugging rule
, 'no-errors': 0
}
