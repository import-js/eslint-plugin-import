import { test, testVersion } from '../utils'

import { RuleTester } from 'eslint'

const ruleTester = new RuleTester()
    , rule = require('rules/order')

function withoutAutofixOutput(test) {
  return Object.assign({}, test, { output: test.code })
}

ruleTester.run('order', rule, {
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
    // Mixing require and import should have import up top
    test({
      code: `
        import async, {foo1} from 'async';
        import relParent2, {foo2} from '../foo/bar';
        import sibling, {foo3} from './foo';
        var fs = require('fs');
        var relParent1 = require('../foo');
        var relParent3 = require('../');
        var index = require('./');
      `,
    }),
    // Option: newlines-between: 'always'
    test({
      code: `
        var fs = require('fs');
        var index = require('./');
        var path = require('path');



        var sibling = require('./foo');


        var relParent1 = require('../foo');
        var relParent3 = require('../');
        var async = require('async');
      `,
      options: [
        {
          groups: [
            ['builtin', 'index'],
            ['sibling'],
            ['parent', 'external'],
          ],
          'newlines-between': 'always',
        },
      ],
    }),
    // Option: newlines-between: 'never'
    test({
      code: `
        var fs = require('fs');
        var index = require('./');
        var path = require('path');
        var sibling = require('./foo');
        var relParent1 = require('../foo');
        var relParent3 = require('../');
        var async = require('async');
      `,
      options: [
        {
          groups: [
            ['builtin', 'index'],
            ['sibling'],
            ['parent', 'external'],
          ],
          'newlines-between': 'never',
        },
      ],
    }),
    // Option: newlines-between: 'ignore'
    test({
      code: `
      var fs = require('fs');

      var index = require('./');
      var path = require('path');
      var sibling = require('./foo');


      var relParent1 = require('../foo');

      var relParent3 = require('../');
      var async = require('async');
      `,
      options: [
        {
          groups: [
            ['builtin', 'index'],
            ['sibling'],
            ['parent', 'external'],
          ],
          'newlines-between': 'ignore',
        },
      ],
    }),
    // 'ignore' should be the default value for `newlines-between`
    test({
      code: `
      var fs = require('fs');

      var index = require('./');
      var path = require('path');
      var sibling = require('./foo');


      var relParent1 = require('../foo');

      var relParent3 = require('../');

      var async = require('async');
      `,
      options: [
        {
          groups: [
            ['builtin', 'index'],
            ['sibling'],
            ['parent', 'external'],
          ],
        },
      ],
    }),
    // Option newlines-between: 'always' with multiline imports #1
    test({
      code: `
        import path from 'path';

        import {
            I,
            Want,
            Couple,
            Imports,
            Here
        } from 'bar';
        import external from 'external'
      `,
      options: [{ 'newlines-between': 'always' }]
    }),
    // Option newlines-between: 'always' with multiline imports #2
    test({
      code: `
        import path from 'path';
        import net
          from 'net';

        import external from 'external'
      `,
      options: [{ 'newlines-between': 'always' }]
    }),
    // Option newlines-between: 'always' with multiline imports #3
    test({
      code: `
        import foo
          from '../../../../this/will/be/very/long/path/and/therefore/this/import/has/to/be/in/two/lines';

        import bar
          from './sibling';
      `,
      options: [{ 'newlines-between': 'always' }]
    }),
    // Option newlines-between: 'always' with not assigned import #1
    test({
      code: `
        import path from 'path';

        import 'loud-rejection';
        import 'something-else';

        import _ from 'lodash';
      `,
      options: [{ 'newlines-between': 'always' }]
    }),
    // Option newlines-between: 'never' with not assigned import #2
    test({
      code: `
        import path from 'path';
        import 'loud-rejection';
        import 'something-else';
        import _ from 'lodash';
      `,
      options: [{ 'newlines-between': 'never' }]
    }),
    // Option newlines-between: 'always' with not assigned require #1
    test({
      code: `
        var path = require('path');

        require('loud-rejection');
        require('something-else');

        var _ = require('lodash');
      `,
      options: [{ 'newlines-between': 'always' }]
    }),
    // Option newlines-between: 'never' with not assigned require #2
    test({
      code: `
        var path = require('path');
        require('loud-rejection');
        require('something-else');
        var _ = require('lodash');
      `,
      options: [{ 'newlines-between': 'never' }]
    }),
    // Option newlines-between: 'never' should ignore nested require statement's #1
    test({
      code: `
        var some = require('asdas');
        var config = {
          port: 4444,
          runner: {
            server_path: require('runner-binary').path,

            cli_args: {
                'webdriver.chrome.driver': require('browser-binary').path
            }
          }
        }
      `,
      options: [{ 'newlines-between': 'never' }]
    }),
    // Option newlines-between: 'always' should ignore nested require statement's #2
    test({
      code: `
        var some = require('asdas');
        var config = {
          port: 4444,
          runner: {
            server_path: require('runner-binary').path,
            cli_args: {
                'webdriver.chrome.driver': require('browser-binary').path
            }
          }
        }
      `,
      options: [{ 'newlines-between': 'always' }]
    }),
    // Option: newlines-between: 'always-and-inside-groups'
    test({
      code: `
        var fs = require('fs');
        var path = require('path');

        var util = require('util');

        var async = require('async');

        var relParent1 = require('../foo');
        var relParent2 = require('../');

        var relParent3 = require('../bar');

        var sibling = require('./foo');
        var sibling2 = require('./bar');

        var sibling3 = require('./foobar');
      `,
      options: [
        {
          'newlines-between': 'always-and-inside-groups',
        },
      ],
    }),
  ],
  invalid: [
    // builtin before external module (require)
    test({
      code: `
        var async = require('async');
        var fs = require('fs');
      `,
      output: `
        var fs = require('fs');
        var async = require('async');
      `,
      errors: [{
        ruleId: 'order',
        message: '`fs` import should occur before import of `async`',
      }],
    }),
    // fix order with spaces on the end of line
    test({
      code: `
        var async = require('async');
        var fs = require('fs');${' '}
      `,
      output: `
        var fs = require('fs');${' '}
        var async = require('async');
      `,
      errors: [{
        ruleId: 'order',
        message: '`fs` import should occur before import of `async`',
      }],
    }),
    // fix order with comment on the end of line
    test({
      code: `
        var async = require('async');
        var fs = require('fs'); /* comment */
      `,
      output: `
        var fs = require('fs'); /* comment */
        var async = require('async');
      `,
      errors: [{
        ruleId: 'order',
        message: '`fs` import should occur before import of `async`',
      }],
    }),
    // fix order with comments at the end and start of line
    test({
      code: `
        /* comment1 */  var async = require('async'); /* comment2 */
        /* comment3 */  var fs = require('fs'); /* comment4 */
      `,
      output: `
        /* comment3 */  var fs = require('fs'); /* comment4 */
        /* comment1 */  var async = require('async'); /* comment2 */
      `,
      errors: [{
        ruleId: 'order',
        message: '`fs` import should occur before import of `async`',
      }],
    }),
    // fix order with few comments at the end and start of line
    test({
      code: `
        /* comment0 */  /* comment1 */  var async = require('async'); /* comment2 */
        /* comment3 */  var fs = require('fs'); /* comment4 */
      `,
      output: `
        /* comment3 */  var fs = require('fs'); /* comment4 */
        /* comment0 */  /* comment1 */  var async = require('async'); /* comment2 */
      `,
      errors: [{
        ruleId: 'order',
        message: '`fs` import should occur before import of `async`',
      }],
    }),
    // fix order with windows end of lines
    test({
      code:
        `/* comment0 */  /* comment1 */  var async = require('async'); /* comment2 */` + `\r\n` +
        `/* comment3 */  var fs = require('fs'); /* comment4 */` + `\r\n`
      ,
      output:
        `/* comment3 */  var fs = require('fs'); /* comment4 */` + `\r\n` +
        `/* comment0 */  /* comment1 */  var async = require('async'); /* comment2 */` + `\r\n`
      ,
      errors: [{
        ruleId: 'order',
        message: '`fs` import should occur before import of `async`',
      }],
    }),
    // fix order with multilines comments at the end and start of line
    test({
      code: `
        /* multiline1
          comment1 */  var async = require('async'); /* multiline2
          comment2 */  var fs = require('fs'); /* multiline3
          comment3 */
      `,
      output: `
        /* multiline1
          comment1 */  var fs = require('fs');` + ' '  + `
  var async = require('async'); /* multiline2
          comment2 *//* multiline3
          comment3 */
      `,
      errors: [{
        ruleId: 'order',
        message: '`fs` import should occur before import of `async`',
      }],
    }),
    // fix order of multile import
    test({
      code: `
        var async = require('async');
        var fs =
          require('fs');
      `,
      output: `
        var fs =
          require('fs');
        var async = require('async');
      `,
      errors: [{
        ruleId: 'order',
        message: '`fs` import should occur before import of `async`',
      }],
    }),
    // fix order at the end of file
    test({
      code: `
        var async = require('async');
        var fs = require('fs');`,
      output: `
        var fs = require('fs');
        var async = require('async');` + '\n',
      errors: [{
        ruleId: 'order',
        message: '`fs` import should occur before import of `async`',
      }],
    }),
    // builtin before external module (import)
    test({
      code: `
        import async from 'async';
        import fs from 'fs';
      `,
      output: `
        import fs from 'fs';
        import async from 'async';
      `,
      errors: [{
        ruleId: 'order',
        message: '`fs` import should occur before import of `async`',
      }],
    }),
    // builtin before external module (mixed import and require)
    test({
      code: `
        var async = require('async');
        import fs from 'fs';
      `,
      output: `
        import fs from 'fs';
        var async = require('async');
      `,
      errors: [{
        ruleId: 'order',
        message: '`fs` import should occur before import of `async`',
      }],
    }),
    // external before parent
    test({
      code: `
        var parent = require('../parent');
        var async = require('async');
      `,
      output: `
        var async = require('async');
        var parent = require('../parent');
      `,
      errors: [{
        ruleId: 'order',
        message: '`async` import should occur before import of `../parent`',
      }],
    }),
    // parent before sibling
    test({
      code: `
        var sibling = require('./sibling');
        var parent = require('../parent');
      `,
      output: `
        var parent = require('../parent');
        var sibling = require('./sibling');
      `,
      errors: [{
        ruleId: 'order',
        message: '`../parent` import should occur before import of `./sibling`',
      }],
    }),
    // sibling before index
    test({
      code: `
        var index = require('./');
        var sibling = require('./sibling');
      `,
      output: `
        var sibling = require('./sibling');
        var index = require('./');
      `,
      errors: [{
        ruleId: 'order',
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
        ruleId: 'order',
        message: '`async` import should occur before import of `./sibling`',
      }, {
        ruleId: 'order',
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
      output: `
        var fs = require('fs');
        var path = require('path');
        var _ = require('lodash');
        var foo = require('foo');
        var bar = require('bar');
        var index = require('./');
      `,
      errors: [{
        ruleId: 'order',
        message: '`./` import should occur after import of `bar`',
      }],
    }),
    // Overriding order to be the reverse of the default order
    test({
      code: `
        var fs = require('fs');
        var index = require('./');
      `,
      output: `
        var index = require('./');
        var fs = require('fs');
      `,
      options: [{groups: ['index', 'sibling', 'parent', 'external', 'builtin']}],
      errors: [{
        ruleId: 'order',
        message: '`./` import should occur before import of `fs`',
      }],
    }),
    // member expression of require
    test(withoutAutofixOutput({
      code: `
        var foo = require('./foo').bar;
        var fs = require('fs');
      `,
      errors: [{
        ruleId: 'order',
        message: '`fs` import should occur before import of `./foo`',
      }],
    })),
    // nested member expression of require
    test(withoutAutofixOutput({
      code: `
        var foo = require('./foo').bar.bar.bar;
        var fs = require('fs');
      `,
      errors: [{
        ruleId: 'order',
        message: '`fs` import should occur before import of `./foo`',
      }],
    })),
    // fix near nested member expression of require with newlines
    test(withoutAutofixOutput({
      code: `
        var foo = require('./foo').bar
          .bar
          .bar;
        var fs = require('fs');
      `,
      errors: [{
        ruleId: 'order',
        message: '`fs` import should occur before import of `./foo`',
      }],
    })),
    // fix nested member expression of require with newlines
    test(withoutAutofixOutput({
      code: `
        var foo = require('./foo');
        var fs = require('fs').bar
          .bar
          .bar;
      `,
      errors: [{
        ruleId: 'order',
        message: '`fs` import should occur before import of `./foo`',
      }],
    })),
    // Grouping import types
    test({
      code: `
        var fs = require('fs');
        var index = require('./');
        var sibling = require('./foo');
        var path = require('path');
      `,
      output: `
        var fs = require('fs');
        var index = require('./');
        var path = require('path');
        var sibling = require('./foo');
      `,
      options: [{groups: [
        ['builtin', 'index'],
        ['sibling', 'parent', 'external'],
      ]}],
      errors: [{
        ruleId: 'order',
        message: '`path` import should occur before import of `./foo`',
      }],
    }),
    // Omitted types should implicitly be considered as the last type
    test({
      code: `
        var path = require('path');
        var async = require('async');
      `,
      output: `
        var async = require('async');
        var path = require('path');
      `,
      options: [{groups: [
        'index',
        ['sibling', 'parent', 'external', 'internal'],
        // missing 'builtin'
      ]}],
      errors: [{
        ruleId: 'order',
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
        ruleId: 'order',
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
        ruleId: 'order',
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
        ruleId: 'order',
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
        ruleId: 'order',
        message: 'Incorrect configuration of the rule: `parent` is duplicated',
      }],
    }),
    // Mixing require and import should have import up top
    test({
      code: `
        import async, {foo1} from 'async';
        import relParent2, {foo2} from '../foo/bar';
        var fs = require('fs');
        var relParent1 = require('../foo');
        var relParent3 = require('../');
        import sibling, {foo3} from './foo';
        var index = require('./');
      `,
      output: `
        import async, {foo1} from 'async';
        import relParent2, {foo2} from '../foo/bar';
        import sibling, {foo3} from './foo';
        var fs = require('fs');
        var relParent1 = require('../foo');
        var relParent3 = require('../');
        var index = require('./');
      `,
      errors: [{
        ruleId: 'order',
        message: '`./foo` import should occur before import of `fs`',
      }],
    }),
    test({
      code: `
        var fs = require('fs');
        import async, {foo1} from 'async';
        import relParent2, {foo2} from '../foo/bar';
      `,
      output: `
        import async, {foo1} from 'async';
        import relParent2, {foo2} from '../foo/bar';
        var fs = require('fs');
      `,
      errors: [{
        ruleId: 'order',
        message: '`fs` import should occur after import of `../foo/bar`',
      }],
    }),
    // Option newlines-between: 'never' - should report unnecessary line between groups
    test({
      code: `
        var fs = require('fs');
        var index = require('./');
        var path = require('path');

        var sibling = require('./foo');

        var relParent1 = require('../foo');
        var relParent3 = require('../');
        var async = require('async');
      `,
      output: `
        var fs = require('fs');
        var index = require('./');
        var path = require('path');
        var sibling = require('./foo');
        var relParent1 = require('../foo');
        var relParent3 = require('../');
        var async = require('async');
      `,
      options: [
        {
          groups: [
            ['builtin', 'index'],
            ['sibling'],
            ['parent', 'external'],
          ],
          'newlines-between': 'never',
        },
      ],
      errors: [
        {
          line: 4,
          message: 'There should be no empty line between import groups',
        },
        {
          line: 6,
          message: 'There should be no empty line between import groups',
        },
      ],
    }),
    // Fix newlines-between with comments after
    test({
      code: `
        var fs = require('fs'); /* comment */

        var index = require('./');
      `,
      output: `
        var fs = require('fs'); /* comment */
        var index = require('./');
      `,
      options: [
        {
          groups: [['builtin'], ['index']],
          'newlines-between': 'never',
        },
      ],
      errors: [
        {
          line: 2,
          message: 'There should be no empty line between import groups',
        },
      ],
    }),
    // Cannot fix newlines-between with multiline comment after
    test({
      code: `
        var fs = require('fs'); /* multiline
        comment */

        var index = require('./');
      `,
      output: `
        var fs = require('fs'); /* multiline
        comment */

        var index = require('./');
      `,
      options: [
        {
          groups: [['builtin'], ['index']],
          'newlines-between': 'never',
        },
      ],
      errors: [
        {
          line: 2,
          message: 'There should be no empty line between import groups',
        },
      ],
    }),
    // Option newlines-between: 'always' - should report lack of newline between groups
    test({
      code: `
        var fs = require('fs');
        var index = require('./');
        var path = require('path');
        var sibling = require('./foo');
        var relParent1 = require('../foo');
        var relParent3 = require('../');
        var async = require('async');
      `,
      output: `
        var fs = require('fs');
        var index = require('./');
        var path = require('path');

        var sibling = require('./foo');

        var relParent1 = require('../foo');
        var relParent3 = require('../');
        var async = require('async');
      `,
      options: [
        {
          groups: [
            ['builtin', 'index'],
            ['sibling'],
            ['parent', 'external'],
          ],
          'newlines-between': 'always',
        },
      ],
      errors: [
        {
          line: 4,
          message: 'There should be at least one empty line between import groups',
        },
        {
          line: 5,
          message: 'There should be at least one empty line between import groups',
        },
      ],
    }),
    // Option newlines-between: 'always' should report unnecessary empty lines space between import groups
    test({
      code: `
        var fs = require('fs');

        var path = require('path');
        var index = require('./');

        var sibling = require('./foo');

        var async = require('async');
      `,
      output: `
        var fs = require('fs');
        var path = require('path');
        var index = require('./');

        var sibling = require('./foo');
        var async = require('async');
      `,
      options: [
        {
          groups: [
            ['builtin', 'index'],
            ['sibling', 'parent', 'external'],
          ],
          'newlines-between': 'always',
        },
      ],
      errors: [
        {
          line: 2,
          message: 'There should be no empty line within import group',
        },
        {
          line: 7,
          message: 'There should be no empty line within import group',
        },
      ],
    }),
    // Option newlines-between: 'never' cannot fix if there are other statements between imports
    test({
      code: `
        import path from 'path';
        import 'loud-rejection';

        import 'something-else';
        import _ from 'lodash';
      `,
      output: `
        import path from 'path';
        import 'loud-rejection';

        import 'something-else';
        import _ from 'lodash';
      `,
      options: [{ 'newlines-between': 'never' }],
      errors: [
        {
          line: 2,
          message: 'There should be no empty line between import groups',
        },
      ],
    }),
    // Option newlines-between: 'always' should report missing empty lines when using not assigned imports
    test({
      code: `
        import path from 'path';
        import 'loud-rejection';
        import 'something-else';
        import _ from 'lodash';
      `,
      output: `
        import path from 'path';

        import 'loud-rejection';
        import 'something-else';
        import _ from 'lodash';
      `,
      options: [{ 'newlines-between': 'always' }],
      errors: [
        {
          line: 2,
          message: 'There should be at least one empty line between import groups',
        },
      ],
    }),
    // fix missing empty lines with single line comment after
    test({
      code: `
        import path from 'path'; // comment
        import _ from 'lodash';
      `,
      output: `
        import path from 'path'; // comment

        import _ from 'lodash';
      `,
      options: [{ 'newlines-between': 'always' }],
      errors: [
        {
          line: 2,
          message: 'There should be at least one empty line between import groups',
        },
      ],
    }),
    // fix missing empty lines with few line block comment after
    test({
      code: `
        import path from 'path'; /* comment */ /* comment */
        import _ from 'lodash';
      `,
      output: `
        import path from 'path'; /* comment */ /* comment */

        import _ from 'lodash';
      `,
      options: [{ 'newlines-between': 'always' }],
      errors: [
        {
          line: 2,
          message: 'There should be at least one empty line between import groups',
        },
      ],
    }),
    // fix missing empty lines with single line block comment after
    test({
      code: `
        import path from 'path'; /* 1
        2 */
        import _ from 'lodash';
      `,
      output: `
        import path from 'path';
 /* 1
        2 */
        import _ from 'lodash';
      `,
      options: [{ 'newlines-between': 'always' }],
      errors: [
        {
          line: 2,
          message: 'There should be at least one empty line between import groups',
        },
      ],
    }),

    // reorder fix cannot cross non import or require
    test(withoutAutofixOutput({
      code: `
        var async = require('async');
        fn_call();
        var fs = require('fs');
      `,
      errors: [{
        ruleId: 'order',
        message: '`fs` import should occur before import of `async`',
      }],
    })),
    // reorder cannot cross non plain requires
    test(withoutAutofixOutput({
      code: `
        var async = require('async');
        var a = require('./value.js')(a);
        var fs = require('fs');
      `,
      errors: [{
        ruleId: 'order',
        message: '`fs` import should occur before import of `async`',
      }],
    })),
    // reorder fixes cannot be applied to non plain requires #1
    test(withoutAutofixOutput({
      code: `
        var async = require('async');
        var fs = require('fs')(a);
      `,
      errors: [{
        ruleId: 'order',
        message: '`fs` import should occur before import of `async`',
      }],
    })),
    // reorder fixes cannot be applied to non plain requires #2
    test(withoutAutofixOutput({
      code: `
        var async = require('async')(a);
        var fs = require('fs');
      `,
      errors: [{
        ruleId: 'order',
        message: '`fs` import should occur before import of `async`',
      }],
    })),
    // cannot require in case of not assignement require
    test(withoutAutofixOutput({
      code: `
        var async = require('async');
        require('./aa');
        var fs = require('fs');
      `,
      errors: [{
        ruleId: 'order',
        message: '`fs` import should occur before import of `async`',
      }],
    })),
    // reorder cannot cross function call (import statement)
    test(withoutAutofixOutput({
      code: `
        import async from 'async';
        fn_call();
        import fs from 'fs';
      `,
      errors: [{
        ruleId: 'order',
        message: '`fs` import should occur before import of `async`',
      }],
    })),
    // reorder cannot cross variable assignemet (import statement)
    test(withoutAutofixOutput({
      code: `
        import async from 'async';
        var a = 1;
        import fs from 'fs';
      `,
      errors: [{
        ruleId: 'order',
        message: '`fs` import should occur before import of `async`',
      }],
    })),
    // reorder cannot cross non plain requires (import statement)
    test(withoutAutofixOutput({
      code: `
        import async from 'async';
        var a = require('./value.js')(a);
        import fs from 'fs';
      `,
      errors: [{
        ruleId: 'order',
        message: '`fs` import should occur before import of `async`',
      }],
    })),
    // cannot reorder in case of not assignement import
    test(withoutAutofixOutput({
      code: `
        import async from 'async';
        import './aa';
        import fs from 'fs';
      `,
      errors: [{
        ruleId: 'order',
        message: '`fs` import should occur before import of `async`',
      }],
    })),
    // fix incorrect order with typescript-eslint-parser
    test({
      code: `
        var async = require('async');
        var fs = require('fs');
      `,
      output: `
        var fs = require('fs');
        var async = require('async');
      `,
      parser: 'typescript-eslint-parser',
      errors: [{
        ruleId: 'order',
        message: '`fs` import should occur before import of `async`',
      }],
    }),
    // fix incorrect order with @typescript-eslint/parser
    testVersion('>5.0.0', {
      code: `
        var async = require('async');
        var fs = require('fs');
      `,
      output: `
        var fs = require('fs');
        var async = require('async');
      `,
      parser: '@typescript-eslint/parser',
      errors: [{
        ruleId: 'order',
        message: '`fs` import should occur before import of `async`',
      }],
    }),
  ].filter((t) => !!t),
})
