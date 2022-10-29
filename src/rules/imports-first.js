import docsUrl from '../docsUrl';

const first = require('./first');

const newMeta = Object.assign({}, first.meta, {
  deprecated: true,
  docs: {
    category: 'Style guide',
    description: 'Replaced by `import/first`.',
    url: docsUrl('imports-first', '7b25c1cb95ee18acc1531002fd343e1e6031f9ed'),
  },
});

module.exports = Object.assign({}, first, { meta: newMeta });
