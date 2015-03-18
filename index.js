exports.rules = {
  "exists": require("./lib/rules/exists"),
  "named": require("./lib/rules/named")
};

exports.rulesConfig = {
  "exists": [2, [".js", ".coffee", ".es6"]],
  "named": [2]
};
