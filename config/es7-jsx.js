/**
 * Parser options to allow ES7 + JSX syntax in imported files.
 */
module.exports = {
  extends: 'import',
  // see https://github.com/babel/babel/tree/master/packages/babylon#options
  // plugins array is not merged with defaults, so include all desired plugins.
  settings: {
    'import/parse-options': { plugins: [ 'decorators'
                                       , 'classProperties'
                                       , 'objectRestSpread'
                                       , 'exportExtensions'
                                       , 'exponentiationOperator'
                                       , 'trailingFunctionCommas'
                                       // react
                                       , 'jsx'
                                       ]
                            }
  }
}
