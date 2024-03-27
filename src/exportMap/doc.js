import doctrine from 'doctrine';

/**
 * parse docs from the first node that has leading comments
 */
export function captureDoc(source, docStyleParsers, ...nodes) {
  const metadata = {};

  // 'some' short-circuits on first 'true'
  nodes.some((n) => {
    try {

      let leadingComments;

      // n.leadingComments is legacy `attachComments` behavior
      if ('leadingComments' in n) {
        leadingComments = n.leadingComments;
      } else if (n.range) {
        leadingComments = source.getCommentsBefore(n);
      }

      if (!leadingComments || leadingComments.length === 0) { return false; }

      for (const name in docStyleParsers) {
        const doc = docStyleParsers[name](leadingComments);
        if (doc) {
          metadata.doc = doc;
        }
      }

      return true;
    } catch (err) {
      return false;
    }
  });

  return metadata;
}

/**
 * parse JSDoc from leading comments
 * @param {object[]} comments
 * @return {{ doc: object }}
 */
function captureJsDoc(comments) {
  let doc;

  // capture XSDoc
  comments.forEach((comment) => {
    // skip non-block comments
    if (comment.type !== 'Block') { return; }
    try {
      doc = doctrine.parse(comment.value, { unwrap: true });
    } catch (err) {
      /* don't care, for now? maybe add to `errors?` */
    }
  });

  return doc;
}

/**
  * parse TomDoc section from comments
  */
function captureTomDoc(comments) {
  // collect lines up to first paragraph break
  const lines = [];
  for (let i = 0; i < comments.length; i++) {
    const comment = comments[i];
    if (comment.value.match(/^\s*$/)) { break; }
    lines.push(comment.value.trim());
  }

  // return doctrine-like object
  const statusMatch = lines.join(' ').match(/^(Public|Internal|Deprecated):\s*(.+)/);
  if (statusMatch) {
    return {
      description: statusMatch[2],
      tags: [{
        title: statusMatch[1].toLowerCase(),
        description: statusMatch[2],
      }],
    };
  }
}

export const availableDocStyleParsers = {
  jsdoc: captureJsDoc,
  tomdoc: captureTomDoc,
};
