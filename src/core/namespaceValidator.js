import Exports from '../ExportMap';

export default function namespaceValidator(
  node,
  namespaces,
  onComputed,
  {
    onNamespaceNotFound = undefined,
    onDeprecation = undefined,
  } = {},
) {
  // go deep
  let namespace = namespaces.get(node.object.name);
  const namepath = [node.object.name];
  
  const sentinel = { __proto__: null }; // callbacks return this value if they want THIS function to stop executing
  
  // while property is namespace and parent is member expression, keep validating
  while (namespace instanceof Exports && node.type === 'MemberExpression') {
    if (node.computed) {
      if (onComputed(node, sentinel) === sentinel) {
        return;
      }
    }

    if (onNamespaceNotFound) {
      if (onNamespaceNotFound(node, namespace, namepath, sentinel) === sentinel) {
        return;
      }
    }

    const exported = namespace.get(node.property.name);
    if (!exported) {
      return;
    }

    if (onDeprecation) {
      onDeprecation(node, exported);
    }

    namepath.push(node.property.name);
    namespace = exported.namespace;
    node = node.parent;
  }
}
