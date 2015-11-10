module.exports = function (context) {
  return {
    'CallExpression': function (call) {
      if (call.callee.type !== 'Identifier') return
      if (call.callee.name !== 'require') return

      if (call.arguments.length !== 1) return
      var module = call.arguments[0]

      if (module.type !== 'Literal') return
      if (typeof module.value !== 'string') return

      // keeping it simple: all 1-string-arg `require` calls are reported
      context.report({
        node: call.callee,
        message: `CommonJS require of module '${module.value}'.`,
      })
    },
  }
}
