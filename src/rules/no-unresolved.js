/**
 * @fileOverview Ensures that an imported path exists, given resolution rules.
 * @author Ben Mosher
 */

import resolve from 'eslint-module-utils/resolve'
import moduleVisitor, { optionsSchema } from 'eslint-module-utils/moduleVisitor'

module.exports = function (context) {

  function checkSourceValue(source) {
    if (resolve(source.value, context) === undefined) {
      context.report(source,
        'Unable to resolve path to module \'' + source.value + '\'.')
    }
  }

  return moduleVisitor(checkSourceValue, context.options[0])

}

module.exports.schema = [ optionsSchema ]
