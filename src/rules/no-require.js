import Exports from '../core/getExports'

module.exports = function (context) {
  return {
    'CallExpression': function (call) {
      if (call.callee.type !== 'Identifier') return
      if (call.callee.name !== 'require') return

      if (call.arguments.length !== 1) return
      var module = call.arguments[0]

      if (module.type !== 'Literal') return
      if (typeof module.value !== 'string') return

      var imports = Exports.get(module.value, context)
      if (!imports || imports.hasDefault || imports.hasNamed) {
        context.report(call.callee,
          'CommonJS require of ES module \'' + module.value + '\'.')
      }
    }
  }
}
