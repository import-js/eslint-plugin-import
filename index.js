exports.rules = {
  'no-unresolved': require('./lib/rules/no-unresolved')
, 'named': require('./lib/rules/named')
, 'default': require('./lib/rules/default')
, 'namespace': require('./lib/rules/namespace')
, 'no-reassign': require('./lib/rules/no-reassign')
, 'no-named-as-default': require('./lib/rules/no-named-as-default')

, 'no-errors': require('./lib/rules/no-errors')
, 'no-require': require('./lib/rules/no-require')

, 'exists': require('./lib/rules/no-unresolved')
}

exports.rulesConfig = {
  'no-unresolved': [2, 'all']
, 'named': 2
, 'namespace': 2
, 'default': 2
, 'no-named-as-default': 2

, 'no-reassign': 1

, 'no-errors': 0
, 'no-require': 0
}

