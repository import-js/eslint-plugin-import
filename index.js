exports.rules = {
  "valid-path": require("./lib/rules/valid-path")
  "named": require("./lib/rules/named")
};

exports.rulesConfig = {
  "valid-path": [2, [".js", ".coffee", ".es6"]]
  "named": [2]
};
