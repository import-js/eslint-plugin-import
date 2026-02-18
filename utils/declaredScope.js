'use strict';

exports.__esModule = true;

const { getScope } = require('./contextCompat');

/** @type {import('./declaredScope').default} */
exports.default = function declaredScope(context, name, node) {
  const references = getScope(context, node).references;
  const reference = references.find((x) => x.identifier.name === name);
  if (!reference || !reference.resolved) { return undefined; }
  return reference.resolved.scope.type;
};
