'use strict';

exports.__esModule = true;

/** @type {import('./declaredScope').default} */
exports.default = function declaredScope(context, name) {
  const references = context.getScope().references;
  const reference = references.find((x) => x.identifier.name === name);
  if (!reference || !reference.resolved) { return undefined; }
  return reference.resolved.scope.type;
};
