var path = require('path')

module.exports = function (context) {
  function checkSelfImport(node) {
    var fileName = path.basename(context.getFilename())
    var fileNameNoExtension = path.basename(fileName, path.extname(fileName))
    var badPaths = ['./' + fileName, './' + fileNameNoExtension]

    if (~badPaths.indexOf(node.source.value)) {
      context.report(node, 'Importing from the current file.')
    }
  }

  return {
    'ImportDeclaration': checkSelfImport.bind(null),
  }
}
