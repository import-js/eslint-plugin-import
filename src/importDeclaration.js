import { getAncestors } from 'eslint-module-utils/contextCompat';

export default function importDeclaration(context, node) {
  const ancestors = getAncestors(context, node);
  return ancestors[ancestors.length - 1];
}
