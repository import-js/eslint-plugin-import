var path = require('path')

// implements a rough version of
// http://webpack.github.io/docs/configuration.html#resolve-alias
module.exports = function resolveAlias(source, aliases) {

  for (var alias in aliases) {
    var match = matchAlias(source, alias, aliases[alias])
    if (match) return match
  }

  // fail out
  return source
}

// using '/' only for consistency with Webpack docs
var sep = '/'
function matchAlias(source, alias, value) {
  var isExact = (alias[alias.length - 1] === '$')
    , isFile = (path.extname(value) !== '')
    , segments = source.split(sep)

  if (isExact) alias = alias.slice(0, -1)

  if (segments[0] === alias) {
    // always return exact match
    if (segments.length === 1) return value

    // prefix match on exact match for file is an error
    if (isFile && (isExact || !/^[./]/.test(value))) {
      throw new Error('can\'t match file with exact alias prefix')
    }

    // otherwise, prefix match is fine for non-file paths
    if (!isExact && !isFile) return [value].concat(segments.slice(1)).join(sep)
  }

}
