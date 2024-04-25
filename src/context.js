function getFilename(context) {
  if ('filename' in context) {
    return context.filename;
  }

  return context.getFilename();
}

function getPhysicalFilename(context) {
  if (context.getPhysicalFilename) {
    return context.getPhysicalFilename();
  }

  return getFilename(context);
}

function getSourceCode(context) {
  if ('sourceCode' in context) {
    return context.sourceCode;
  }

  return context.getSourceCode();
}

function getScope(context, node) {
  const sourceCode = getSourceCode(context);

  if (sourceCode && sourceCode.getScope) {
    return sourceCode.getScope(node);
  }

  return context.getScope();
}

function getAncestors(context, node) {
  const sourceCode = getSourceCode(context);

  if (sourceCode && sourceCode.getAncestors) {
    return sourceCode.getAncestors(node);
  }

  return context.getAncestors();
}

function getDeclaredVariables(context, node) {
  const sourceCode = getSourceCode(context);

  if (sourceCode && sourceCode.getDeclaredVariables) {
    return sourceCode.getDeclaredVariables(node);
  }

  return context.getDeclaredVariables(node);
}

module.exports = {
  getFilename,
  getPhysicalFilename,
  getSourceCode,
  getScope,
  getAncestors,
  getDeclaredVariables,
};
