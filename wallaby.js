module.exports = (wallaby) => ({
  files: [
    'src/**/*.js',
    'package.json',
    'config/**/*.js',
    'tests/src/utils.js',
    'tests/src/core/parseStubParser.js',
    { pattern: '**/.eslintrc', instrument: false },
    { pattern: 'tests/files/**/*.*', instrument: false },
  ],

  tests: [
    'tests/**/*.js',
    '!tests/src/utils.js',
    '!tests/src/core/parseStubParser.js',
    '!tests/files/**/*.*',
  ],

  env: {
    type: 'node',
    params: {
      env: `NODE_PATH=./src`,
    },
  },

  compilers: {
    '**/*.js': wallaby.compilers.babel(),
  },
})
