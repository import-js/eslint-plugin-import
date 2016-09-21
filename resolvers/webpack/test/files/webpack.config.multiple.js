var path = require('path')

module.exports = [{
  name: 'one',
}, {
  name: 'two',
  resolve: {
    root: path.join(__dirname, 'src'),
    fallback: path.join(__dirname, 'fallback'),
  },
}, {
  name: 'three',
  resolve: {
    alias: {
      'foo': path.join(__dirname, 'some', 'goofy', 'path', 'foo.js'),
    },
    modules: [
      path.join(__dirname, 'src'),
      'node_modules',
      'bower_components',
    ],
    modulesDirectories: ['node_modules', 'bower_components'],
    root: path.join(__dirname, 'src'),
  },
}]
