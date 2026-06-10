import { basename } from 'path';
import docsUrl from '../docsUrl';

function getIgnoreList(options) {
  return options && options[0] && options[0].ignore;
}

function getFilenameWithoutExtension(path) {
  return basename(path).split('.')[0];
}

function shouldIgnore(path, ignoreList) {
  if (!ignoreList) {
    return false;
  }

  return ignoreList.some((pattern) => new RegExp(pattern).test(path));
}

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      category: 'Best Practices',
      description: 'Disallow index files',
      url: docsUrl('no-indexes'),
    },
    schema: [
      {
        type: 'object',
        properties: {
          ignore: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
        },
        additionalProperties: false,
      },
    ],
  },
  create: function (context) {
    return {
      Program(node) {
        const path = context.getFilename();
        const name = getFilenameWithoutExtension(path);
        const ignoreList = getIgnoreList(context.options);

        if (name === 'index' && !shouldIgnore(path, ignoreList)) {
          context.report(node, 'Index files are not allowed.');
        }
      },
    };
  },
};
