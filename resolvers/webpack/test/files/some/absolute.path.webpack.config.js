var path = require('path')

module.exports = {
  resolve: {
    alias: {
      'foo': path.join(__dirname, 'absolutely', 'goofy', 'path', 'foo.js'),
    },
    modules: [
      path.join(__dirname, 'src'),
      'node_modules',
      'bower_components',
    ],
    modulesDirectories: ['node_modules', 'bower_components'],
    root: path.join(__dirname, 'src'),
  },

  externals: [
    { 'jquery': 'jQuery' },
    'bootstrap',
  ],
}
