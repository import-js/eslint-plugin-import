/**
 * Traverse a pattern/identifier node, calling 'callback'
 * for each leaf identifier.
 * @param  {node}   pattern
 * @param  {Function} callback
 * @return {void}
 */
export default function recursivePatternCapture(pattern, callback) {
  switch (pattern.type) {
    case 'Identifier': // base case
      callback(pattern);
      break;

    case 'ObjectPattern':
      pattern.properties.forEach((p) => {
        if (p.type === 'ExperimentalRestProperty' || p.type === 'RestElement') {
          callback(p.argument);
          return;
        }
        recursivePatternCapture(p.value, callback);
      });
      break;

    case 'ArrayPattern':
      pattern.elements.forEach((element) => {
        if (element == null) { return; }
        if (element.type === 'ExperimentalRestProperty' || element.type === 'RestElement') {
          callback(element.argument);
          return;
        }
        recursivePatternCapture(element, callback);
      });
      break;

    case 'AssignmentPattern':
      callback(pattern.left);
      break;
    default:
  }
}
