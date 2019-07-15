/**
 * import { b, c, a } from 'a'
 * to
 * import { a, b, c } from 'a'
 */
import docsUrl from '../docsUrl'

const messages = {
  notInOrder: 'Imported members must be sorted alphabetically',
}

const schema = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      caseInsensitive: { type: 'boolean' },
    },
  },
  maxItems: 1,
}

const defaultOption = { caseInsensitive: false }

/**
 * @param {ImportSpecifier} node 
 * @returns {string}
 */
function buildImportString(node) {
  return node.imported.name === node.local.name
    ? node.imported.name
    : `${node.imported.name} as ${node.local.name}`
}

/**
 * @param {string} strA 
 * @param {string} strB 
 * @returns {number} -1, 0, 1 for sort
 */
function sortImport(strA, strB) {
  if (strA > strB) {
    return 1
  }
  if (strA < strB) {
    return -1
  }
  return 0
}

function create(ctx) {
  const { caseInsensitive } = ctx.options[0] || defaultOption

  const getNameForSort = (node) => (
    caseInsensitive ? node.imported.name.toLowerCase() : node.imported.name
  )

  return {
    ImportDeclaration: (node) => {
      const imports = node.specifiers.filter(
        s => s.type === 'ImportSpecifier'
      )

      const ordered = imports.every((val, idx) => (
        idx >= imports.length - 1
        || getNameForSort(val) <= getNameForSort(imports[idx + 1])
      ))
      if (ordered) {
        return
      }

      const fix = (fixer) => {
        const orderedImports = [...imports]
        orderedImports.sort((nodeA, nodeB) => sortImport(
          getNameForSort(nodeA),
          getNameForSort(nodeB)
        ))
        return orderedImports.map((orderedImport, idx) => fixer.replaceText(
          imports[idx], buildImportString(orderedImport)
        ))
      }

      ctx.report({
        fix,
        node,
        messageId: 'notInOrder',
      })
    },
  }
}

module.exports = {
  meta: {
    type: 'suggestion',
    fixable: 'code',
    schema,
    messages,
    docs: {
      url: docsUrl('order-member'),
    },
  },
  create,
}
