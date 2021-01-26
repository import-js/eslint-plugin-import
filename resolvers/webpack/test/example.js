'use strict';

const path = require('path');

const resolve = require('../index').resolve;

const file = path.join(__dirname, 'files', 'src', 'dummy.js');

const webpackDir = path.join(__dirname, 'different-package-location');

console.log(resolve('main-module', file, { config: 'webpack.config.js', cwd: webpackDir }));
