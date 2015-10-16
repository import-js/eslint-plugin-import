'use strict'

var getExports = require('../core/getExports').get

module.exports = function (context) {
  return {
    'CallExpression': function (call) {
      if (call.callee.type !== 'Identifier') return
      if (call.callee.name !== 'require') return

      if (call.arguments.length !== 1) return
      var module = call.arguments[0]

      if (module.type !== 'Literal') return
      if (typeof module.value !== 'string') return

      var imports = getExports(module.value, context)
      if (!imports || imports.hasDefault || imports.hasNamed) {
        context.report(call.callee,
          'CommonJS require of ES module \'' + module.value + '\'.')
      }
    }
  }
}
