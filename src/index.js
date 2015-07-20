export const rules = {
  'no-unresolved': require('./rules/no-unresolved')
, 'named': require('./rules/named')
, 'default': require('./rules/default')
, 'namespace': require('./rules/namespace')
, 'no-reassign': require('./rules/no-reassign')
, 'no-named-as-default': require('./rules/no-named-as-default')

, 'no-errors': require('./rules/no-errors')
, 'no-require': require('./rules/no-require')

, 'exists': require('./rules/no-unresolved')

, 'export': require('./rules/export')
}

export const rulesConfig = {
  'no-unresolved': 2
, 'named': 2
, 'namespace': 2
, 'default': 2
, 'no-named-as-default': 2
, 'export': 2

, 'no-reassign': 1

, 'no-errors': 0
, 'no-require': 0
}
