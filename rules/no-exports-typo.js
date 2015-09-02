/**
 * @fileoverview Rule to avoid module.exports typos
 * @author Jamund Ferguson
 */

'use strict';

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------


module.exports = function(context) {

	return {

		'MemberExpression': function(node) {

			// module.exports typos
			if (node.object.name === 'module' && node.property.name !== 'exports') {
				context.report(node, 'Expected module.exports.');
			}

		}
	};

};
