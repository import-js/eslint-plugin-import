exports.rules = {
  "no-unresolved": require("./lib/rules/no-unresolved"),
  "named": require("./lib/rules/named"),
  "default": require("./lib/rules/default"),
  "namespace": require("./lib/rules/namespace"),

  "no-reassign": require("./lib/rules/no-reassign"),

  "no-common": require("./lib/rules/no-common"),
  "no-errors": require("./lib/rules/no-errors"),

  "exists": require("./lib/rules/no-unresolved")
};

exports.rulesConfig = {
  "no-unresolved": 2,
  "named": 2,
  "namespace": 2,
  "default": 2,

  "no-reassign": 1,

  "no-common": 0,
  "no-errors": 0
};
