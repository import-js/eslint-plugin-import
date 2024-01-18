module.exports = {
  presets: [
    [
      '@1stg',
      {
        modules: 'commonjs',
      },
    ],
  ],
  plugins: ['@babel/proposal-export-default-from'],
}
