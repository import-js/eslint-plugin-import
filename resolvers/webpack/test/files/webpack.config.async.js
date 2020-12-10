const config = require('./webpack.config.js')

module.exports = function() {
  return new Promise(function(resolve) {
    resolve(config)
  })
}
