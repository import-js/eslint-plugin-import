exports.rules = {
  "exists": require("./lib/rules/exists"),
  "named": require("./lib/rules/named")
};

exports.rulesConfig = {
  "exists": 2,
  "named": 2
};
