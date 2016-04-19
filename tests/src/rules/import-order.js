import { test } from '../utils'

import { RuleTester } from 'eslint'

const ruleTester = new RuleTester()
    , rule = require('rules/import-order')

ruleTester.run('import-order', rule, {
  valid: [
    // Default order using require
    test({
      code: `
        var fs = require('fs');
        var async = require('async');
        var relParent1 = require('../foo');
        var relParent2 = require('../foo/bar');
        var relParent3 = require('../');
        var sibling = require('./foo');
        var index = require('./');`,
      }),
    // Default order using import
    test({
      code: `
        import fs from 'fs';
        import async, {foo1} from 'async';
        import relParent1 from '../foo';
        import relParent2, {foo2} from '../foo/bar';
        import relParent3 from '../';
        import sibling, {foo3} from './foo';
        import index from './';`,
      }),
    // Default order using both require and import
    test({
      code: `
        var fs = require('fs');
        import async, {foo1} from 'async';
        var relParent1 = require('../foo');
        import relParent2, {foo2} from '../foo/bar';
        var relParent3 = require('../');
        import sibling, {foo3} from './foo';
        var index = require('./');`,
      }),
    // Multiple module of the same rank next to each other
    test({
      code: `
        var fs = require('fs');
        var fs = require('fs');
        var path = require('path');
        var _ = require('lodash');
        var async = require('async');`,
      }),
    // Overriding order to be the reverse of the default order
    test({
      code: `
        var index = require('./');
        var sibling = require('./foo');
        var relParent3 = require('../');
        var relParent2 = require('../foo/bar');
        var relParent1 = require('../foo');
        var async = require('async');
        var fs = require('fs');
      `,
      options: [{groups: ['index', 'sibling', 'parent', 'external', 'builtin']}],
    }),
    // Ignore dynamic requires
    test({
      code: `
        var path = require('path');
        var _ = require('lodash');
        var async = require('async');
        var fs = require('f' + 's');`,
    }),
    // Ignore non-require call expressions
    test({
      code: `
        var path = require('path');
        var result = add(1, 2);
        var _ = require('lodash');`,
    }),
    // Ignore requires that are not at the top-level
    test({
      code: `
        var index = require('./');
        function foo() {
          var fs = require('fs');
        }
        () => require('fs');
        if (a) {
          require('fs');
        }`,
    }),
    // Ignore unknown/invalid cases
    test({
      code: `
        var unknown1 = require('/unknown1');
        var fs = require('fs');
        var unknown2 = require('/unknown2');
        var async = require('async');
        var unknown3 = require('/unknown3');
        var foo = require('../foo');
        var unknown4 = require('/unknown4');
        var bar = require('../foo/bar');
        var unknown5 = require('/unknown5');
        var parent = require('../');
        var unknown6 = require('/unknown6');
        var foo = require('./foo');
        var unknown7 = require('/unknown7');
        var index = require('./');
        var unknown8 = require('/unknown8');
    `}),
    // Ignoring unassigned values by default (require)
    test({
      code: `
        require('./foo');
        require('fs');
        var path = require('path');
    `}),
    // Ignoring unassigned values by default (import)
    test({
      code: `
        import './foo';
        import 'fs';
        import path from 'path';
    `}),
    // No imports
    test({
      code: `
        function add(a, b) {
          return a + b;
        }
        var foo;
    `}),
    // Grouping import types
    test({
      code: `
        var fs = require('fs');
        var index = require('./');
        var path = require('path');

        var sibling = require('./foo');
        var relParent3 = require('../');
        var async = require('async');
        var relParent1 = require('../foo');
      `,
      options: [{groups: [
        ['builtin', 'index'],
        ['sibling', 'parent', 'external'],
      ]}],
    }),
    // Omitted types should implicitly be considered as the last type
    test({
      code: `
        var index = require('./');
        var path = require('path');
      `,
      options: [{groups: [
        'index',
        ['sibling', 'parent', 'external'],
        // missing 'builtin'
      ]}],
    }),
  ],
  invalid: [
    // builtin before external module (require)
    test({
      code: `
        var async = require('async');
        var fs = require('fs');
      `,
      errors: [{
        ruleId: 'import-order',
        message: '`fs` import should occur before import of `async`',
      }],
    }),
    // builtin before external module (import)
    test({
      code: `
        import async from 'async';
        import fs from 'fs';
      `,
      errors: [{
        ruleId: 'import-order',
        message: '`fs` import should occur before import of `async`',
      }],
    }),
    // builtin before external module (mixed import and require)
    test({
      code: `
        var async = require('async');
        import fs from 'fs';
      `,
      errors: [{
        ruleId: 'import-order',
        message: '`fs` import should occur before import of `async`',
      }],
    }),
    // external before parent
    test({
      code: `
        var parent = require('../parent');
        var async = require('async');
      `,
      errors: [{
        ruleId: 'import-order',
        message: '`async` import should occur before import of `../parent`',
      }],
    }),
    // parent before sibling
    test({
      code: `
        var sibling = require('./sibling');
        var parent = require('../parent');
      `,
      errors: [{
        ruleId: 'import-order',
        message: '`../parent` import should occur before import of `./sibling`',
      }],
    }),
    // sibling before index
    test({
      code: `
        var index = require('./');
        var sibling = require('./sibling');
      `,
      errors: [{
        ruleId: 'import-order',
        message: '`./sibling` import should occur before import of `./`',
      }],
    }),
    // Multiple errors
    test({
      code: `
        var sibling = require('./sibling');
        var async = require('async');
        var fs = require('fs');
      `,
      errors: [{
        ruleId: 'import-order',
        message: '`async` import should occur before import of `./sibling`',
      }, {
        ruleId: 'import-order',
        message: '`fs` import should occur before import of `./sibling`',
      }],
    }),
    // Uses 'after' wording if it creates less errors
    test({
      code: `
        var index = require('./');
        var fs = require('fs');
        var path = require('path');
        var _ = require('lodash');
        var foo = require('foo');
        var bar = require('bar');
      `,
      errors: [{
        ruleId: 'import-order',
        message: '`./` import should occur after import of `bar`',
      }],
    }),
    // Overriding order to be the reverse of the default order
    test({
      code: `
        var fs = require('fs');
        var index = require('./');
      `,
      options: [{groups: ['index', 'sibling', 'parent', 'external', 'builtin']}],
      errors: [{
        ruleId: 'import-order',
        message: '`./` import should occur before import of `fs`',
      }],
    }),
    // member expression of require
    test({
      code: `
        var foo = require('./foo').bar;
        var fs = require('fs');
      `,
      errors: [{
        ruleId: 'import-order',
        message: '`fs` import should occur before import of `./foo`',
      }],
    }),
    // nested member expression of require
    test({
      code: `
        var foo = require('./foo').bar.bar.bar;
        var fs = require('fs');
      `,
      errors: [{
        ruleId: 'import-order',
        message: '`fs` import should occur before import of `./foo`',
      }],
    }),
    // Grouping import types
    test({
      code: `
        var fs = require('fs');
        var index = require('./');
        var sibling = require('./foo');
        var path = require('path');
      `,
      options: [{groups: [
        ['builtin', 'index'],
        ['sibling', 'parent', 'external'],
      ]}],
      errors: [{
        ruleId: 'import-order',
        message: '`path` import should occur before import of `./foo`',
      }],
    }),
    // Omitted types should implicitly be considered as the last type
    test({
      code: `
        var path = require('path');
        var async = require('async');
      `,
      options: [{groups: [
        'index',
        ['sibling', 'parent', 'external', 'internal'],
        // missing 'builtin'
      ]}],
      errors: [{
        ruleId: 'import-order',
        message: '`async` import should occur before import of `path`',
      }],
    }),
    // Setting the order for an unknown type
    // should make the rule trigger an error and do nothing else
    test({
      code: `
        var async = require('async');
        var index = require('./');
      `,
      options: [{groups: [
        'index',
        ['sibling', 'parent', 'UNKNOWN', 'internal'],
      ]}],
      errors: [{
        ruleId: 'import-order',
        message: 'Incorrect configuration of the rule: Unknown type `"UNKNOWN"`',
      }],
    }),
    // Type in an array can't be another array, too much nesting
    test({
      code: `
        var async = require('async');
        var index = require('./');
      `,
      options: [{groups: [
        'index',
        ['sibling', 'parent', ['builtin'], 'internal'],
      ]}],
      errors: [{
        ruleId: 'import-order',
        message: 'Incorrect configuration of the rule: Unknown type `["builtin"]`',
      }],
    }),
    // No numbers
    test({
      code: `
        var async = require('async');
        var index = require('./');
      `,
      options: [{groups: [
        'index',
        ['sibling', 'parent', 2, 'internal'],
      ]}],
      errors: [{
        ruleId: 'import-order',
        message: 'Incorrect configuration of the rule: Unknown type `2`',
      }],
    }),
    // Duplicate
    test({
      code: `
        var async = require('async');
        var index = require('./');
      `,
      options: [{groups: [
        'index',
        ['sibling', 'parent', 'parent', 'internal'],
      ]}],
      errors: [{
        ruleId: 'import-order',
        message: 'Incorrect configuration of the rule: `parent` is duplicated',
      }],
    }),
  ],
})
