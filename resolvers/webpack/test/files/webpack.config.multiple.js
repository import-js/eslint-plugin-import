var path = require('path')

module.exports = [{
  name: 'one',
}, {
  name: 'two',
  resolve: {
    alias: {
      'foo': path.join(__dirname, 'some', 'goofy', 'path', 'foo.js'),
    },
    modulesDirectories: ['node_modules', 'bower_components'],
    root: path.join(__dirname, 'src'),
    fallback: path.join(__dirname, 'fallback'),
  },
}]
