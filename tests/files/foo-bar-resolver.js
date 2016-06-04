var path = require('path');

exports.resolve = function(source, file) {
    return { found: true, path: path.join(__dirname, 'bar.jsx') };
};

exports.interfaceVersion = 2;
