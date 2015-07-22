export default function ignore(path, context) {
  // ignore node_modules by default
  var ignoreStrings = context.settings['import/ignore']
    ? [].concat(context.settings['import/ignore'])
    : ['node_modules']

  if (ignoreStrings.length === 0) return false

  for (var i = 0; i < ignoreStrings.length; i++) {
    var regex = new RegExp(ignoreStrings[i])
    if (regex.test(path)) return true
  }

  return false
}
