export default function isStaticImport(node) {
  return node &&
    node.callee &&
    node.callee.type === 'Import' &&
    node.arguments.length === 1 &&
    node.arguments[0].type === 'Literal' &&
    typeof node.arguments[0].value === 'string'
}
