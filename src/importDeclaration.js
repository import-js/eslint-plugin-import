export default function importDeclaration(context) {
  const ancestors = context.getAncestors()
  return ancestors[ancestors.length - 1]
}
