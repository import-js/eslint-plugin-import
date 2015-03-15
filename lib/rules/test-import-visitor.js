module.exports = function (context) {
	return {
		"ImportDeclaration": function (node) {
			context.report(node, "This is an import!");
		}
	};
};