var path = require('path')

module.exports = {
  resolve: {
    alias: {
      'foo': path.join(__dirname, 'some', 'goofy', 'path', 'foo.js'),
    },
  },
}
