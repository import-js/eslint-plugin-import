exports.rules = {
  "exists": require("./lib/rules/exists"),
  "named": require("./lib/rules/named"),
  "default": require("./lib/rules/default"),
  "namespace": require("./lib/rules/namespace"),

  "no-common": require("./lib/rules/no-common")
};

exports.rulesConfig = {
  "exists": 2,
  "named": 2,
  "namespace": 2,
  "default": 2,

  "no-common": 0
};
