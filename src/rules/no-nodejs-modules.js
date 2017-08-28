import path from 'path'
import minimatch from 'minimatch'
import importType from '../core/importType'
import isStaticRequire from '../core/staticRequire'

function reportIfMissing(context, node, allowed, name) {
  if (allowed.indexOf(name) === -1 && importType(name, context) === 'builtin') {
    context.report(node, 'Do not import Node.js builtin module "' + name + '"')
  }
}

function isIgnored(ignored, filename) {
  return ignored.some(c => (
    minimatch(filename, c) ||
    minimatch(filename, path.join(process.cwd(), c))
  ))
}

module.exports = {
  meta: {
    docs: {},
    schema: [{
      type: 'object',
      properties: {
        allow: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
        ignore: {
          oneOf: [{
            type: 'string',
          }, {
            type: 'array',
            items: {
              type: 'string',
            },
          }],
        },
      },
      additionalProperties: false,
    }],
  },

  create: function (context) {
    const options = context.options[0] || {}
    const allowed = options.allow || []
    const ignored = [].concat(options.ignore || [])
    const filename = context.getFilename()

    return {
      ImportDeclaration: function handleImports(node) {
        if (!isIgnored(ignored, filename)) {
          reportIfMissing(context, node, allowed, node.source.value)
        }
      },
      CallExpression: function handleRequires(node) {
        if (isStaticRequire(node) && !isIgnored(ignored, filename)) {
          reportIfMissing(context, node, allowed, node.arguments[0].value)
        }
      },
    }
  },
}
