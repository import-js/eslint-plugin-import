module.exports = function resolveAlias(path, aliases) {
  if (aliases && path in aliases) {
    return aliases[path]
  }

  return path
}
