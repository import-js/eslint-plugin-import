/**
 * @fileoverview Rule to prefer ES6 to CJS
 * @author Jamund Ferguson
 */

'use strict';

var EXPORT_MESSAGE = 'Expected "export" or "export default"',
	IMPORT_MESSAGE = 'Expected "import" instead of "require()"';

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------


module.exports = function(context) {

	return {

		'MemberExpression': function(node) {

			// module.exports
			if (node.object.name === 'module' && node.property.name === 'exports') {
				context.report(node, EXPORT_MESSAGE);
			}

			// exports.
			if (node.object.name === 'exports') {
				context.report(node, EXPORT_MESSAGE);
			}

		},
		'CallExpression': function(node) {
			if (node.callee.name === 'require') {
				if (node.arguments.length === 1 && node.arguments[0].type === 'Literal') {
					if (node.parent.parent.type === 'Program' || node.parent.parent.parent.type === 'Program') {
						context.report(node, IMPORT_MESSAGE);
					}
				}
			}
		}
	};

};
