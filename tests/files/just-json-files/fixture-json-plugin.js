// Stand-in for eslint-plugin-json for #1645 regression test

'use strict';

var parseErrorsByFile = {};

var processor = {
  preprocess: function (text, filename) {
    try {
      JSON.parse(text);
      delete parseErrorsByFile[filename];
    } catch (e) {
      parseErrorsByFile[filename] = [{
        ruleId: 'json/*',
        severity: 2,
        message: 'Invalid JSON',
        line: 1,
        column: 1,
        endLine: 1,
        endColumn: 2,
        nodeType: null,
      }];
    }
    return ['']; // one empty JS block: no JS rules can report on it
  },
  postprocess: function (messages, filename) {
    var own = parseErrorsByFile[filename] || [];
    delete parseErrorsByFile[filename];
    return own; // discard messages[] from the empty block
  },
  supportsAutofix: false,
};

module.exports = {
  // no-op rule so `json/*` resolves under eslint 9+ flat config (it rejects unresolved plugin rules)
  rules: {
    '*': { create: function () { return {}; } },
  },
  processors: {
    '.json': processor,
    json: processor,
  },
  configs: {
    recommended: {
      plugins: ['json'],
      rules: { 'json/*': 'error' },
    },
  },
};
