module.exports = {
  externals: [
    { 'jquery': 'jQuery' },
    'bootstrap',
    function ({ request }, callback) {
      if (request === 'underscore') {
        return callback(null, 'underscore')
      }
      callback()
    },
    function ({ request, getResolve }, callback) {
      if (request === 'graphql') {
        const resolve = getResolve()
        // dummy call (some-module should be resolved on __dirname)
        resolve(__dirname, 'some-module', function (err, value) {
          if (err) {
            callback(err)
          } else {
            callback(null, 'graphql')
          }
        })
      } else {
        callback()
      }
    },
  ],
}
