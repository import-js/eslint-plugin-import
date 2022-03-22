import fs from 'fs';
import minimatch from 'minimatch';
import docsUrl from '../docsUrl';

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Prevent the use of shallow imports',
      recommended: true,
      url: docsUrl('no-shallow-imports'),
    },
    schema: [
      {
        oneOf: [
          {
            type: 'object',
            properties: {
              allow: {
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
    ],
  },
  create: context => {
    return {
      ImportDeclaration: node => maybeReportShallowImport(node, context),
    };
  },
};

const maybeReportShallowImport = (node, context) => {
  const filenamePath = context.getFilename();

  const options = context.options[0] || {};
  const allowRegexps = (options.allow || []).map(p => minimatch.makeRe(p));

  const doesFileMatchAllowRegexps = allowRegexps.some(regex => regex.test(filenamePath));

  // If the file does not match the regexps and is a shallow import, then report it
  if (!doesFileMatchAllowRegexps && isShallowImport(node, context)) {
    return context.report({
      node,
      message: 'Please deep import!',
    });
  }
};

const isCalledIndex = filename => filename.slice(0, 5) === 'index';

const isShallowImport = (node, context) => {
  const filenamePath = context.getFilename();
  const sourcePath = node.source.value;
  const segments = sourcePath.split('/');
  const lastSegment = segments[segments.length - 1];

  if (sourcePath[0] !== '.') {
    return false; // not a relative path, ie. it does not start with '.' or '..'
  }

  // Source ends in '..' (eg. '..', '../..', etc.)
  if (lastSegment === '..') return true;

  // Source ends in 'index(\..*)?' (eg. 'index', 'index.js', 'index.etc')
  if (isCalledIndex(lastSegment)) return true;

  // Source is a directory
  if (isDirectory(filenamePath, sourcePath)) return true;

  return false;
};

const isDirectory = (filename, source) => {
  const filenameSegments = filename.split('/');
  const sourceSegments = source.split('/');

  if (sourceSegments[0] === '.') {
    sourceSegments.shift();
  }

  while (sourceSegments[0] === '..') {
    filenameSegments.pop();
    sourceSegments.shift();
  }

  // Swap out the last element in filenameSegments with the remaining sourceSegments
  filenameSegments.splice(filenameSegments.length - 1, 1, ...sourceSegments);

  const absoluteSource = filenameSegments.join('/');

  try {
    const stat = fs.statSync(absoluteSource);
    return stat.isDirectory();
  } catch (e) {
    return false;
  }
};
