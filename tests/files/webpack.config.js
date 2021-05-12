module.exports = {
  resolve: {
    extensions: ['', '.js', '.jsx', '.d.ts'],
    root: __dirname,
    alias: {
      'alias/chai$': 'chai' // alias for no-extraneous-dependencies tests
    }
  },
}
