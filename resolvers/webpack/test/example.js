var path = require('path')

var resolve = require('../index').resolve

var file = path.join(__dirname, 'files', 'src', 'dummy.js')

var webpackDir = path.join(__dirname, "different-package-location")

console.log(resolve('main-module', file, { config: "webpack.config.js", cwd: webpackDir}))
