var path = require('path')

module.exports = {
  resolve: {
    alias: {
      'foo': path.join(__dirname, 'some', 'goofy', 'path', 'foo.js'),
    },
    modulesDirectories: ['node_modules', 'bower_components'],
    root: path.join(__dirname, 'src'),
  },

  externals: [
    { 'jquery': 'jQuery' },
    'bootstrap',
  ],
}
