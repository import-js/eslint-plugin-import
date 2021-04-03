module.exports = {
  externals: [
    { 'jquery': 'jQuery' },
    'bootstrap',
    async function ({ request },) {
      if (request === 'underscore') {
        return 'underscore'
      }
    },
    function ({ request, getResolve }, callback) {
      if (request === 'graphql') {
        const resolve = getResolve()
        // dummy call (some-module should be resolved on __dirname)
        resolve(__dirname, 'some-module').then(
          function () { callback(null, 'graphql') },
          function (e) { callback(e) }
        )
      }
    },
  ],
}
