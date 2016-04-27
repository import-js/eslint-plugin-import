import path from 'path'

export default {
  resolve: {
    alias: {
      'foo': path.join(__dirname, 'some', 'goofy', 'path', 'foo.js'),
    },
    modulesDirectories: ['node_modules', 'bower_components'],
    root: path.join(__dirname, 'src'),
    fallback: path.join(__dirname, 'fallback'),
  },

  externals: [
    { 'jquery': 'jQuery' },
    'bootstrap',
  ],
}
