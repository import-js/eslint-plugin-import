exports.rules = {
  "exists": require("./lib/rules/exists"),
  "named": require("./lib/rules/named"),
  "default": require("./lib/rules/default")
};

exports.rulesConfig = {
  "exists": 2,
  "named": 2,
  "default": 2
};
