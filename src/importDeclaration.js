export default function importDeclaration(context) {
  var ancestors = context.getAncestors()
  return ancestors[ancestors.length - 1]
}
