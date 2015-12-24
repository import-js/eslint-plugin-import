/**
 * @fileoverview Rule to prefer CJS to AMD
 * @author Jamund Ferguson
 */

'use strict';

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = function(context) {

	return {

		'CallExpression': function(node) {

			if (node.callee.name === 'define') {
				context.report(node, 'Expected require() instead of define().');
			}
		}
	};

};
