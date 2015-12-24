/**
 * @fileoverview Rule to prefer CJS to AMD
 * @author Jamund Ferguson
 */

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = function(context) {

	return {

		'CallExpression': function(node) {

			if (node.callee.name === 'define') {
				context.report(node, 'Expected imports instead of define().')
			}
		},
	}

}
