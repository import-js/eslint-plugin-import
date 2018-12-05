/* compiled with babel */
'use strict'

Object.defineProperty(exports, '__esModule', {
  value: true,
})

var _defaultExport = require('./default-export')

Object.defineProperty(exports, 'bar', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_defaultExport).default
  },
})

var _namedDefaultExport = require('./named-default-export')

Object.defineProperty(exports, 'foo', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_namedDefaultExport).default
  },
})

var _common = require('./common')

Object.defineProperty(exports, 'common', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_common).default
  },
})

var _t = require('./t')

Object.defineProperty(exports, 't', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_t).default
  },
})

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj } }

exports.baz = 'baz? really?'
