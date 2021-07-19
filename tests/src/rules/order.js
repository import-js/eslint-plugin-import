import { test, getTSParsers, getNonDefaultParsers } from '../utils';

import { RuleTester } from 'eslint';
import eslintPkg from 'eslint/package.json';
import semver from 'semver';
import flatMap from 'array.prototype.flatmap';

const ruleTester = new RuleTester();
const rule = require('rules/order');

function withoutAutofixOutput(test) {
  return Object.assign({}, test, { output: test.code });
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
        var relParent4 = require('..');
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
      options: [{ groups: ['index', 'sibling', 'parent', 'external', 'builtin'] }],
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
    // Ignore requires that are not at the top-level #1
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
    // Ignore requires that are not at the top-level #2
    test({
      code: `
        const foo = [
          require('./foo'),
          require('fs'),
        ]`,
    }),
    // Ignore requires in template literal (#1936)
    test({
      code: "const foo = `${require('./a')} ${require('fs')}`",
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
    ` }),
    // Ignoring unassigned values by default (require)
    test({
      code: `
        require('./foo');
        require('fs');
        var path = require('path');
    ` }),
    // Ignoring unassigned values by default (import)
    test({
      code: `
        import './foo';
        import 'fs';
        import path from 'path';
    ` }),
    // No imports
    test({
      code: `
        function add(a, b) {
          return a + b;
        }
        var foo;
    ` }),
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
      options: [{ groups: [
        ['builtin', 'index'],
        ['sibling', 'parent', 'external'],
      ] }],
    }),
    // Omitted types should implicitly be considered as the last type
    test({
      code: `
        var index = require('./');
        var path = require('path');
      `,
      options: [{ groups: [
        'index',
        ['sibling', 'parent', 'external'],
        // missing 'builtin'
      ] }],
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
    ...flatMap(getTSParsers(), parser => [
      // Export equals expressions should be on top alongside with ordinary import-statements.
      test({
        code: `
          import async, {foo1} from 'async';
          import relParent2, {foo2} from '../foo/bar';
          import sibling, {foo3} from './foo';
          var fs = require('fs');
          var util = require("util");
          var relParent1 = require('../foo');
          var relParent3 = require('../');
          var index = require('./');
        `,
        parser,
      }),

      test({
        code: `
          export import CreateSomething = _CreateSomething;
        `,
        parser,
      }),
    ]),
    // Adding unknown import types (e.g. using a resolver alias via babel) to the groups.
    test({
      code: `
        import fs from 'fs';
        import { Input } from '-/components/Input';
        import { Button } from '-/components/Button';
        import { add } from './helper';`,
      options: [{
        groups: ['builtin', 'external', 'unknown', 'parent', 'sibling', 'index'],
      }],
    }),
    // Using unknown import types (e.g. using a resolver alias via babel) with
    // an alternative custom group list.
    test({
      code: `
        import { Input } from '-/components/Input';
        import { Button } from '-/components/Button';
        import fs from 'fs';
        import { add } from './helper';`,
      options: [{
        groups: [ 'unknown', 'builtin', 'external', 'parent', 'sibling', 'index' ],
      }],
    }),
    // Using unknown import types (e.g. using a resolver alias via babel)
    // Option: newlines-between: 'always'
    test({
      code: `
        import fs from 'fs';

        import { Input } from '-/components/Input';
        import { Button } from '-/components/Button';

        import p from '..';
        import q from '../';

        import { add } from './helper';

        import i from '.';
        import j from './';`,
      options: [
        {
          'newlines-between': 'always',
          groups: ['builtin', 'external', 'unknown', 'parent', 'sibling', 'index'],
        },
      ],
    }),

    // Using pathGroups to customize ordering, position 'after'
    test({
      code: `
        import fs from 'fs';
        import _ from 'lodash';
        import { Input } from '~/components/Input';
        import { Button } from '#/components/Button';
        import { add } from './helper';`,
      options: [{
        pathGroups: [
          { pattern: '~/**', group: 'external', position: 'after' },
          { pattern: '#/**', group: 'external', position: 'after' },
        ],
      }],
    }),
    // pathGroup without position means "equal" with group
    test({
      code: `
        import fs from 'fs';
        import { Input } from '~/components/Input';
        import async from 'async';
        import { Button } from '#/components/Button';
        import _ from 'lodash';
        import { add } from './helper';`,
      options: [{
        pathGroups: [
          { pattern: '~/**', group: 'external' },
          { pattern: '#/**', group: 'external' },
        ],
      }],
    }),
    // Using pathGroups to customize ordering, position 'before'
    test({
      code: `
        import fs from 'fs';

        import { Input } from '~/components/Input';

        import { Button } from '#/components/Button';

        import _ from 'lodash';

        import { add } from './helper';`,
      options: [{
        'newlines-between': 'always',
        pathGroups: [
          { pattern: '~/**', group: 'external', position: 'before' },
          { pattern: '#/**', group: 'external', position: 'before' },
        ],
      }],
    }),
    // Using pathGroups to customize ordering, with patternOptions
    test({
      code: `
        import fs from 'fs';

        import _ from 'lodash';

        import { Input } from '~/components/Input';

        import { Button } from '!/components/Button';

        import { add } from './helper';`,
      options: [{
        'newlines-between': 'always',
        pathGroups: [
          { pattern: '~/**', group: 'external', position: 'after' },
          { pattern: '!/**', patternOptions: { nonegate: true }, group: 'external', position: 'after' },
        ],
      }],
    }),
    // Using pathGroups to customize ordering for imports that are recognized as 'external'
    // by setting pathGroupsExcludedImportTypes without 'external'
    test({
      code: `
        import fs from 'fs';

        import { Input } from '@app/components/Input';

        import { Button } from '@app2/components/Button';

        import _ from 'lodash';

        import { add } from './helper';`,
      options: [{
        'newlines-between': 'always',
        pathGroupsExcludedImportTypes: ['builtin'],
        pathGroups: [
          { pattern: '@app/**', group: 'external', position: 'before' },
          { pattern: '@app2/**', group: 'external', position: 'before' },
        ],
      }],
    }),
    // Using pathGroups (a test case for https://github.com/benmosher/eslint-plugin-import/pull/1724)
    test({
      code: `
        import fs from 'fs';
        import external from 'external';
        import externalTooPlease from './make-me-external';

        import sibling from './sibling';`,
      options: [{
        'newlines-between': 'always',
        pathGroupsExcludedImportTypes: [],
        pathGroups: [
          { pattern: './make-me-external', group: 'external' },
        ],
        groups: [['builtin', 'external'], 'internal', 'parent', 'sibling', 'index'],
      }],
    }),
    // Monorepo setup, using Webpack resolver, workspace folder name in external-module-folders
    test({
      code: `
        import _ from 'lodash';
        import m from '@test-scope/some-module';

        import bar from './bar';
      `,
      options: [{
        'newlines-between': 'always',
      }],
      settings: {
        'import/resolver': 'webpack',
        'import/external-module-folders': ['node_modules', 'symlinked-module'],
      },
    }),
    // Monorepo setup, using Node resolver (doesn't resolve symlinks)
    test({
      code: `
        import _ from 'lodash';
        import m from '@test-scope/some-module';

        import bar from './bar';
      `,
      options: [{
        'newlines-between': 'always',
      }],
      settings: {
        'import/resolver': 'node',
        'import/external-module-folders': ['node_modules', 'symlinked-module'],
      },
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
      options: [{ 'newlines-between': 'always' }],
    }),
    // Option newlines-between: 'always' with multiline imports #2
    test({
      code: `
        import path from 'path';
        import net
          from 'net';

        import external from 'external'
      `,
      options: [{ 'newlines-between': 'always' }],
    }),
    // Option newlines-between: 'always' with multiline imports #3
    test({
      code: `
        import foo
          from '../../../../this/will/be/very/long/path/and/therefore/this/import/has/to/be/in/two/lines';

        import bar
          from './sibling';
      `,
      options: [{ 'newlines-between': 'always' }],
    }),
    // Option newlines-between: 'always' with not assigned import #1
    test({
      code: `
        import path from 'path';

        import 'loud-rejection';
        import 'something-else';

        import _ from 'lodash';
      `,
      options: [{ 'newlines-between': 'always' }],
    }),
    // Option newlines-between: 'never' with not assigned import #2
    test({
      code: `
        import path from 'path';
        import 'loud-rejection';
        import 'something-else';
        import _ from 'lodash';
      `,
      options: [{ 'newlines-between': 'never' }],
    }),
    // Option newlines-between: 'always' with not assigned require #1
    test({
      code: `
        var path = require('path');

        require('loud-rejection');
        require('something-else');

        var _ = require('lodash');
      `,
      options: [{ 'newlines-between': 'always' }],
    }),
    // Option newlines-between: 'never' with not assigned require #2
    test({
      code: `
        var path = require('path');
        require('loud-rejection');
        require('something-else');
        var _ = require('lodash');
      `,
      options: [{ 'newlines-between': 'never' }],
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
      options: [{ 'newlines-between': 'never' }],
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
      options: [{ 'newlines-between': 'always' }],
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
    // Option alphabetize: {order: 'ignore'}
    test({
      code: `
        import a from 'foo';
        import b from 'bar';

        import index from './';
      `,
      options: [{
        groups: ['external', 'index'],
        alphabetize: { order: 'ignore' },
      }],
    }),
    // Option alphabetize: {order: 'asc'}
    test({
      code: `
        import c from 'Bar';
        import b from 'bar';
        import a from 'foo';

        import index from './';
      `,
      options: [{
        groups: ['external', 'index'],
        alphabetize: { order: 'asc' },
      }],
    }),
    // Option alphabetize: {order: 'desc'}
    test({
      code: `
        import a from 'foo';
        import b from 'bar';
        import c from 'Bar';

        import index from './';
      `,
      options: [{
        groups: ['external', 'index'],
        alphabetize: { order: 'desc' },
      }],
    }),
    // Option alphabetize with newlines-between: {order: 'asc', newlines-between: 'always'}
    test({
      code: `
        import b from 'Bar';
        import c from 'bar';
        import a from 'foo';

        import index from './';
      `,
      options: [{
        groups: ['external', 'index'],
        alphabetize: { order: 'asc' },
        'newlines-between': 'always',
      }],
    }),
    // Alphabetize with require
    test({
      code: `
        import { hello } from './hello';
        import { int } from './int';
        const blah = require('./blah');
        const { cello } = require('./cello');
      `,
      options: [
        {
          alphabetize: {
            order: 'asc',
          },
        },
      ],
    }),
    // Order of imports with similar names
    test({
      code: `
        import React from 'react';
        import { BrowserRouter } from 'react-router-dom';
      `,
      options: [
        {
          alphabetize: {
            order: 'asc',
          },
        },
      ],
    }),
    test({
      code: `
        import { UserInputError } from 'apollo-server-express';

        import { new as assertNewEmail } from '~/Assertions/Email';
      `,
      options: [{
        alphabetize: {
          caseInsensitive: true,
          order: 'asc',
        },
        pathGroups: [
          { pattern: '~/*', group: 'internal' },
        ],
        groups: [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index',
        ],
        'newlines-between': 'always',
      }],
    }),
    test({
      code: `
        import { ReactElement, ReactNode } from 'react';

        import { util } from 'Internal/lib';

        import { parent } from '../parent';

        import { sibling } from './sibling';
      `,
      options: [{
        alphabetize: {
          caseInsensitive: true,
          order: 'asc',
        },
        pathGroups: [
          { pattern: 'Internal/**/*', group: 'internal' },
        ],
        groups: [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index',
        ],
        'newlines-between': 'always',
        pathGroupsExcludedImportTypes: [],
      }],
    }),
    ...flatMap(getTSParsers, parser => [
      // Order of the `import ... = require(...)` syntax
      test({
        code: `
          import blah = require('./blah');
          import { hello } from './hello';`,
        parser,
        options: [
          {
            alphabetize: {
              order: 'asc',
            },
          },
        ],
      }),
      // Order of object-imports
      test({
        code: `
          import blah = require('./blah');
          import log = console.log;`,
        parser,
        options: [
          {
            alphabetize: {
              order: 'asc',
            },
          },
        ],
      }),
      // Object-imports should not be forced to be alphabetized
      test({
        code: `
          import debug = console.debug;
          import log = console.log;`,
        parser,
        options: [
          {
            alphabetize: {
              order: 'asc',
            },
          },
        ],
      }),
      test({
        code: `
          import log = console.log;
          import debug = console.debug;`,
        parser,
        options: [
          {
            alphabetize: {
              order: 'asc',
            },
          },
        ],
      }),
      test({
        code: `
          import { a } from "./a";
          export namespace SomeNamespace {
              export import a2 = a;
          }
        `,
        parser,
        options: [
          {
            groups: ['external', 'index'],
            alphabetize: { order: 'asc' },
          },
        ],
      }),
    ]),
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
        message: '`fs` import should occur before import of `async`',
      }],
    }),
    // fix order with windows end of lines
    test({
      code:
        `/* comment0 */  /* comment1 */  var async = require('async'); /* comment2 */` + `\r\n` +
        `/* comment3 */  var fs = require('fs'); /* comment4 */` + `\r\n`,
      output:
        `/* comment3 */  var fs = require('fs'); /* comment4 */` + `\r\n` +
        `/* comment0 */  /* comment1 */  var async = require('async'); /* comment2 */` + `\r\n`,
      errors: [{
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
        message: '`fs` import should occur before import of `async`',
      }],
    }),
    // fix destructured commonjs import
    test({
      code: `
        var {b} = require('async');
        var {a} = require('fs');
      `,
      output: `
        var {a} = require('fs');
        var {b} = require('async');
      `,
      errors: [{
        message: '`fs` import should occur before import of `async`',
      }],
    }),
    // fix order of multiline import
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
        message: '`./sibling` import should occur before import of `./`',
      }],
    }),
    // Multiple errors
    ...semver.satisfies(eslintPkg.version, '< 3.0.0') ? [] : [
      test({
        code: `
          var sibling = require('./sibling');
          var async = require('async');
          var fs = require('fs');
        `,
        output: `
          var async = require('async');
          var sibling = require('./sibling');
          var fs = require('fs');
        `,
        errors: [{
          message: '`async` import should occur before import of `./sibling`',
        }, {
          message: '`fs` import should occur before import of `./sibling`',
        }],
      }),
    ],
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
      options: [{ groups: ['index', 'sibling', 'parent', 'external', 'builtin'] }],
      errors: [{
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
      options: [{ groups: [
        ['builtin', 'index'],
        ['sibling', 'parent', 'external'],
      ] }],
      errors: [{
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
      options: [{ groups: [
        'index',
        ['sibling', 'parent', 'external', 'internal'],
        // missing 'builtin'
      ] }],
      errors: [{
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
      options: [{ groups: [
        'index',
        ['sibling', 'parent', 'UNKNOWN', 'internal'],
      ] }],
      errors: [{
        message: 'Incorrect configuration of the rule: Unknown type `"UNKNOWN"`',
      }],
    }),
    // Type in an array can't be another array, too much nesting
    test({
      code: `
        var async = require('async');
        var index = require('./');
      `,
      options: [{ groups: [
        'index',
        ['sibling', 'parent', ['builtin'], 'internal'],
      ] }],
      errors: [{
        message: 'Incorrect configuration of the rule: Unknown type `["builtin"]`',
      }],
    }),
    // No numbers
    test({
      code: `
        var async = require('async');
        var index = require('./');
      `,
      options: [{ groups: [
        'index',
        ['sibling', 'parent', 2, 'internal'],
      ] }],
      errors: [{
        message: 'Incorrect configuration of the rule: Unknown type `2`',
      }],
    }),
    // Duplicate
    test({
      code: `
        var async = require('async');
        var index = require('./');
      `,
      options: [{ groups: [
        'index',
        ['sibling', 'parent', 'parent', 'internal'],
      ] }],
      errors: [{
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
        message: '`fs` import should occur after import of `../foo/bar`',
      }],
    }),
    ...flatMap(getTSParsers(), parser => [
      // Order of the `import ... = require(...)` syntax
      test({
        code: `
          var fs = require('fs');
          import async, {foo1} from 'async';
          import bar = require("../foo/bar");
        `,
        output: `
          import async, {foo1} from 'async';
          import bar = require("../foo/bar");
          var fs = require('fs');
        `,
        parser,
        errors: [{
          message: '`fs` import should occur after import of `../foo/bar`',
        }],
      }),
      test({
        code: `
          var async = require('async');
          var fs = require('fs');
        `,
        output: `
          var fs = require('fs');
          var async = require('async');
        `,
        parser,
        errors: [{
          message: '`fs` import should occur before import of `async`',
        }],
      }),
      test({
        code: `
          import sync = require('sync');
          import async, {foo1} from 'async';

          import index from './';
        `,
        output: `
          import async, {foo1} from 'async';
          import sync = require('sync');

          import index from './';
        `,
        options: [{
          groups: ['external', 'index'],
          alphabetize: { order: 'asc' },
        }],
        parser,
        errors: [{
          message: '`async` import should occur before import of `sync`',
        }],
      }),
      // Order of object-imports
      test({
        code: `
          import log = console.log;
          import blah = require('./blah');`,
        parser,
        errors: [{
          message: '`./blah` import should occur before import of `console.log`',
        }],
      }),
    ]),
    // Default order using import with custom import alias
    test({
      code: `
        import { Button } from '-/components/Button';
        import { add } from './helper';
        import fs from 'fs';
      `,
      output: `
        import fs from 'fs';
        import { Button } from '-/components/Button';
        import { add } from './helper';
      `,
      options: [
        {
          groups: ['builtin', 'external', 'unknown', 'parent', 'sibling', 'index'],
        },
      ],
      errors: [
        {
          line: 4,
          message: '`fs` import should occur before import of `-/components/Button`',
        },
      ],
    }),
    // Default order using import with custom import alias
    test({
      code: `
        import fs from 'fs';
        import { Button } from '-/components/Button';
        import { LinkButton } from '-/components/Link';
        import { add } from './helper';
      `,
      output: `
        import fs from 'fs';

        import { Button } from '-/components/Button';
        import { LinkButton } from '-/components/Link';

        import { add } from './helper';
      `,
      options: [
        {
          groups: ['builtin', 'external', 'unknown', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
        },
      ],
      errors: [
        {
          line: 2,
          message: 'There should be at least one empty line between import groups',
        },
        {
          line: 4,
          message: 'There should be at least one empty line between import groups',
        },
      ],
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
    // Option newlines-between: 'never' with unassigned imports and warnOnUnassignedImports disabled
    // newline is preserved to match existing behavior
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
      options: [{ 'newlines-between': 'never', warnOnUnassignedImports: false }],
      errors: [
        {
          line: 2,
          message: 'There should be no empty line between import groups',
        },
      ],
    }),
    // Option newlines-between: 'never' with unassigned imports and warnOnUnassignedImports enabled
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
      options: [{ 'newlines-between': 'never', warnOnUnassignedImports: true }],
      errors: [
        {
          line: 3,
          message: 'There should be no empty line between import groups',
        },
      ],
    }),
    // Option newlines-between: 'never' cannot fix if there are other statements between imports
    test({
      code: `
        import path from 'path';
        export const abc = 123;

        import 'something-else';
        import _ from 'lodash';
      `,
      output: `
        import path from 'path';
        export const abc = 123;

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
    // reorder fix cannot cross function call on moving below #1
    test({
      code: `
        const local = require('./local');

        fn_call();

        const global1 = require('global1');
        const global2 = require('global2');

        fn_call();
      `,
      output: `
        const local = require('./local');

        fn_call();

        const global1 = require('global1');
        const global2 = require('global2');

        fn_call();
      `,
      errors: [{
        message: '`./local` import should occur after import of `global2`',
      }],
    }),
    // reorder fix cannot cross function call on moving below #2
    test({
      code: `
        const local = require('./local');
        fn_call();
        const global1 = require('global1');
        const global2 = require('global2');

        fn_call();
      `,
      output: `
        const local = require('./local');
        fn_call();
        const global1 = require('global1');
        const global2 = require('global2');

        fn_call();
      `,
      errors: [{
        message: '`./local` import should occur after import of `global2`',
      }],
    }),
    // reorder fix cannot cross function call on moving below #3
    test({
      code: `
        const local1 = require('./local1');
        const local2 = require('./local2');
        const local3 = require('./local3');
        const local4 = require('./local4');
        fn_call();
        const global1 = require('global1');
        const global2 = require('global2');
        const global3 = require('global3');
        const global4 = require('global4');
        const global5 = require('global5');
        fn_call();
      `,
      output: `
        const local1 = require('./local1');
        const local2 = require('./local2');
        const local3 = require('./local3');
        const local4 = require('./local4');
        fn_call();
        const global1 = require('global1');
        const global2 = require('global2');
        const global3 = require('global3');
        const global4 = require('global4');
        const global5 = require('global5');
        fn_call();
      `,
      errors: [
        '`./local1` import should occur after import of `global5`',
        '`./local2` import should occur after import of `global5`',
        '`./local3` import should occur after import of `global5`',
        '`./local4` import should occur after import of `global5`',
      ],
    }),
    // reorder fix cannot cross function call on moving below
    test(withoutAutofixOutput({
      code: `
        const local = require('./local');
        const global1 = require('global1');
        const global2 = require('global2');
        fn_call();
        const global3 = require('global3');

        fn_call();
      `,
      errors: [{
        message: '`./local` import should occur after import of `global3`',
      }],
    })),
    // reorder fix cannot cross function call on moving below
    // fix imports that not crosses function call only
    test({
      code: `
        const local1 = require('./local1');
        const global1 = require('global1');
        const global2 = require('global2');
        fn_call();
        const local2 = require('./local2');
        const global3 = require('global3');
        const global4 = require('global4');

        fn_call();
      `,
      output: `
        const local1 = require('./local1');
        const global1 = require('global1');
        const global2 = require('global2');
        fn_call();
        const global3 = require('global3');
        const global4 = require('global4');
        const local2 = require('./local2');

        fn_call();
      `,
      errors: [
        '`./local1` import should occur after import of `global4`',
        '`./local2` import should occur after import of `global4`',
      ],
    }),
    // pathGroup with position 'after'
    test({
      code: `
        import fs from 'fs';
        import _ from 'lodash';
        import { add } from './helper';
        import { Input } from '~/components/Input';
        `,
      output: `
        import fs from 'fs';
        import _ from 'lodash';
        import { Input } from '~/components/Input';
        import { add } from './helper';
        `,
      options: [{
        pathGroups: [
          { pattern: '~/**', group: 'external', position: 'after' },
        ],
      }],
      errors: [{
        message: '`~/components/Input` import should occur before import of `./helper`',
      }],
    }),
    // pathGroup without position
    test({
      code: `
        import fs from 'fs';
        import _ from 'lodash';
        import { add } from './helper';
        import { Input } from '~/components/Input';
        import async from 'async';
        `,
      output: `
        import fs from 'fs';
        import _ from 'lodash';
        import { Input } from '~/components/Input';
        import async from 'async';
        import { add } from './helper';
        `,
      options: [{
        pathGroups: [
          { pattern: '~/**', group: 'external' },
        ],
      }],
      errors: [{
        message: '`./helper` import should occur after import of `async`',
      }],
    }),
    // pathGroup with position 'before'
    test({
      code: `
        import fs from 'fs';
        import _ from 'lodash';
        import { add } from './helper';
        import { Input } from '~/components/Input';
        `,
      output: `
        import fs from 'fs';
        import { Input } from '~/components/Input';
        import _ from 'lodash';
        import { add } from './helper';
        `,
      options: [{
        pathGroups: [
          { pattern: '~/**', group: 'external', position: 'before' },
        ],
      }],
      errors: [{
        message: '`~/components/Input` import should occur before import of `lodash`',
      }],
    }),
    // multiple pathGroup with different positions for same group, fix for 'after'
    test({
      code: `
        import fs from 'fs';
        import { Import } from '$/components/Import';
        import _ from 'lodash';
        import { Output } from '~/components/Output';
        import { Input } from '#/components/Input';
        import { add } from './helper';
        import { Export } from '-/components/Export';
        `,
      output: `
        import fs from 'fs';
        import { Export } from '-/components/Export';
        import { Import } from '$/components/Import';
        import _ from 'lodash';
        import { Output } from '~/components/Output';
        import { Input } from '#/components/Input';
        import { add } from './helper';
        `,
      options: [{
        pathGroups: [
          { pattern: '~/**', group: 'external', position: 'after' },
          { pattern: '#/**', group: 'external', position: 'after' },
          { pattern: '-/**', group: 'external', position: 'before' },
          { pattern: '$/**', group: 'external', position: 'before' },
        ],
      }],
      errors: [
        {
          message: '`-/components/Export` import should occur before import of `$/components/Import`',
        },
      ],
    }),

    // multiple pathGroup with different positions for same group, fix for 'before'
    test({
      code: `
        import fs from 'fs';
        import { Export } from '-/components/Export';
        import { Import } from '$/components/Import';
        import _ from 'lodash';
        import { Input } from '#/components/Input';
        import { add } from './helper';
        import { Output } from '~/components/Output';
        `,
      output: `
        import fs from 'fs';
        import { Export } from '-/components/Export';
        import { Import } from '$/components/Import';
        import _ from 'lodash';
        import { Output } from '~/components/Output';
        import { Input } from '#/components/Input';
        import { add } from './helper';
        `,
      options: [{
        pathGroups: [
          { pattern: '~/**', group: 'external', position: 'after' },
          { pattern: '#/**', group: 'external', position: 'after' },
          { pattern: '-/**', group: 'external', position: 'before' },
          { pattern: '$/**', group: 'external', position: 'before' },
        ],
      }],
      errors: [
        {
          message: '`~/components/Output` import should occur before import of `#/components/Input`',
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
        message: '`fs` import should occur before import of `async`',
      }],
    })),
    // reorder fix cannot cross function call on moving below (from #1252)
    test({
      code: `
        const env = require('./config');

        Object.keys(env);

        const http = require('http');
        const express = require('express');

        http.createServer(express());
      `,
      output: `
        const env = require('./config');

        Object.keys(env);

        const http = require('http');
        const express = require('express');

        http.createServer(express());
      `,
      errors: [{
        message: '`./config` import should occur after import of `express`',
      }],
    }),
    // reorder cannot cross non plain requires
    test(withoutAutofixOutput({
      code: `
        var async = require('async');
        var a = require('./value.js')(a);
        var fs = require('fs');
      `,
      errors: [{
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
        message: '`fs` import should occur before import of `async`',
      }],
    })),
    // cannot require in case of not assignment require
    test(withoutAutofixOutput({
      code: `
        var async = require('async');
        require('./aa');
        var fs = require('fs');
      `,
      errors: [{
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
        message: '`fs` import should occur before import of `async`',
      }],
    })),
    // reorder cannot cross variable assignment (import statement)
    test(withoutAutofixOutput({
      code: `
        import async from 'async';
        var a = 1;
        import fs from 'fs';
      `,
      errors: [{
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
        message: '`fs` import should occur before import of `async`',
      }],
    })),
    // cannot reorder in case of not assignment import
    test(withoutAutofixOutput({
      code: `
        import async from 'async';
        import './aa';
        import fs from 'fs';
      `,
      errors: [{
        message: '`fs` import should occur before import of `async`',
      }],
    })),
    // Option alphabetize: {order: 'asc'}
    test({
      code: `
        import b from 'bar';
        import c from 'Bar';
        import a from 'foo';

        import index from './';
      `,
      output: `
        import c from 'Bar';
        import b from 'bar';
        import a from 'foo';

        import index from './';
      `,
      options: [{
        groups: ['external', 'index'],
        alphabetize: { order: 'asc' },
      }],
      errors: [{
        message: '`Bar` import should occur before import of `bar`',
      }],
    }),
    // Option alphabetize: {order: 'desc'}
    test({
      code: `
        import a from 'foo';
        import c from 'Bar';
        import b from 'bar';

        import index from './';
      `,
      output: `
        import a from 'foo';
        import b from 'bar';
        import c from 'Bar';

        import index from './';
      `,
      options: [{
        groups: ['external', 'index'],
        alphabetize: { order: 'desc' },
      }],
      errors: [{
        message: '`bar` import should occur before import of `Bar`',
      }],
    }),
    // Option alphabetize {order: 'asc': caseInsensitive: true}
    test({
      code: `
        import b from 'foo';
        import a from 'Bar';

        import index from './';
      `,
      output: `
        import a from 'Bar';
        import b from 'foo';

        import index from './';
      `,
      options: [{
        groups: ['external', 'index'],
        alphabetize: { order: 'asc', caseInsensitive: true },
      }],
      errors: [{
        message: '`Bar` import should occur before import of `foo`',
      }],
    }),
    // Option alphabetize {order: 'desc': caseInsensitive: true}
    test({
      code: `
        import a from 'Bar';
        import b from 'foo';

        import index from './';
      `,
      output: `
        import b from 'foo';
        import a from 'Bar';

        import index from './';
      `,
      options: [{
        groups: ['external', 'index'],
        alphabetize: { order: 'desc', caseInsensitive: true },
      }],
      errors: [{
        message: '`foo` import should occur before import of `Bar`',
      }],
    }),
    // Alphabetize with parent paths
    test({
      code: `
        import a from '../a';
        import p from '..';
      `,
      output: `
        import p from '..';
        import a from '../a';
      `,
      options: [{
        groups: ['external', 'index'],
        alphabetize: { order: 'asc' },
      }],
      errors: [{
        message: '`..` import should occur before import of `../a`',
      }],
    }),
    // Alphabetize with require
    ...semver.satisfies(eslintPkg.version, '< 3.0.0') ? [] : [
      test({
        code: `
          const { cello } = require('./cello');
          import { int } from './int';
          const blah = require('./blah');
          import { hello } from './hello';
        `,
        output: `
          import { int } from './int';
          const { cello } = require('./cello');
          const blah = require('./blah');
          import { hello } from './hello';
        `,
        errors: [{
          message: '`./int` import should occur before import of `./cello`',
        }, {
          message: '`./hello` import should occur before import of `./cello`',
        }],
      }),
    ],
  ].filter((t) => !!t),
});


context('TypeScript', function () {
  getNonDefaultParsers()
    .filter((parser) => parser !== require.resolve('typescript-eslint-parser'))
    .forEach((parser) => {
      const parserConfig = {
        parser: parser,
        settings: {
          'import/parsers': { [parser]: ['.ts'] },
          'import/resolver': { 'eslint-import-resolver-typescript': true },
        },
      };

      ruleTester.run('order', rule, {
        valid: [
          // #1667: typescript type import support

          // Option alphabetize: {order: 'asc'}
          test(
            {
              code: `
                import c from 'Bar';
                import type { C } from 'Bar';
                import b from 'bar';
                import a from 'foo';
                import type { A } from 'foo';

                import index from './';
              `,
              parser,
              options: [
                {
                  groups: ['external', 'index'],
                  alphabetize: { order: 'asc' },
                },
              ],
            },
            parserConfig,
          ),
          // Option alphabetize: {order: 'desc'}
          test(
            {
              code: `
                import a from 'foo';
                import type { A } from 'foo';
                import b from 'bar';
                import c from 'Bar';
                import type { C } from 'Bar';

                import index from './';
              `,
              parser,
              options: [
                {
                  groups: ['external', 'index'],
                  alphabetize: { order: 'desc' },
                },
              ],
            },
            parserConfig,
          ),
          // Option alphabetize: {order: 'asc'} with type group
          test(
            {
              code: `
                import c from 'Bar';
                import b from 'bar';
                import a from 'foo';

                import index from './';

                import type { C } from 'Bar';
                import type { A } from 'foo';
              `,
              parser,
              options: [
                {
                  groups: ['external', 'index', 'type'],
                  alphabetize: { order: 'asc' },
                },
              ],
            },
            parserConfig,
          ),
          // Option alphabetize: {order: 'asc'} with type group & path group
          test(
            {
              // only: true,
              code: `
                import c from 'Bar';
                import a from 'foo';

                import b from 'dirA/bar';

                import index from './';

                import type { C } from 'dirA/Bar';
                import type { A } from 'foo';
              `,
              parser,
              options: [
                {
                  alphabetize: { order: 'asc' },
                  groups: ['external', 'internal', 'index', 'type'],
                  pathGroups: [
                    {
                      pattern: 'dirA/**',
                      group: 'internal',
                    },
                  ],
                  'newlines-between': 'always',
                  pathGroupsExcludedImportTypes: ['type'],
                },
              ],
            },
            parserConfig,
          ),
          // Option alphabetize: {order: 'asc'} with path group
          test(
            {
              // only: true,
              code: `
                import c from 'Bar';
                import type { A } from 'foo';
                import a from 'foo';

                import type { C } from 'dirA/Bar';
                import b from 'dirA/bar';

                import index from './';
              `,
              parser,
              options: [
                {
                  alphabetize: { order: 'asc' },
                  groups: ['external', 'internal', 'index'],
                  pathGroups: [
                    {
                      pattern: 'dirA/**',
                      group: 'internal',
                    },
                  ],
                  'newlines-between': 'always',
                  pathGroupsExcludedImportTypes: [],
                },
              ],
            },
            parserConfig,
          ),
          // Option alphabetize: {order: 'desc'} with type group
          test(
            {
              code: `
                import a from 'foo';
                import b from 'bar';
                import c from 'Bar';

                import index from './';

                import type { A } from 'foo';
                import type { C } from 'Bar';
              `,
              parser,
              options: [
                {
                  groups: ['external', 'index', 'type'],
                  alphabetize: { order: 'desc' },
                },
              ],
            },
            parserConfig,
          ),
          test(
            {
              code: `
                import { Partner } from '@models/partner/partner';
                import { PartnerId } from '@models/partner/partner-id';
              `,
              parser,
              options: [
                {
                  alphabetize: { order: 'asc' },
                },
              ],
            },
            parserConfig,
          ),
          test(
            {
              code: `
                import { serialize, parse, mapFieldErrors } from '@vtaits/form-schema';
                import type { GetFieldSchema } from '@vtaits/form-schema';
                import { useMemo, useCallback } from 'react';
                import type { ReactElement, ReactNode } from 'react';
                import { Form } from 'react-final-form';
                import type { FormProps as FinalFormProps } from 'react-final-form';
              `,
              parser,
              options: [
                {
                  alphabetize: { order: 'asc' },
                },
              ],
            },
            parserConfig,
          ),
        ],
        invalid: [
          // Option alphabetize: {order: 'asc'}
          test(
            {
              code: `
                import b from 'bar';
                import c from 'Bar';
                import type { C } from 'Bar';
                import a from 'foo';
                import type { A } from 'foo';

                import index from './';
              `,
              output: `
                import c from 'Bar';
                import type { C } from 'Bar';
                import b from 'bar';
                import a from 'foo';
                import type { A } from 'foo';

                import index from './';
              `,
              parser,
              options: [
                {
                  groups: ['external', 'index'],
                  alphabetize: { order: 'asc' },
                },
              ],
              errors: [
                {
                  message: semver.satisfies(eslintPkg.version, '< 3')
                    ? '`bar` import should occur after import of `Bar`'
                    : /(`bar` import should occur after import of `Bar`)|(`Bar` import should occur before import of `bar`)/,
                },
              ],
            },
            parserConfig,
          ),
          // Option alphabetize: {order: 'desc'}
          test(
            {
              code: `
                import a from 'foo';
                import type { A } from 'foo';
                import c from 'Bar';
                import type { C } from 'Bar';
                import b from 'bar';

                import index from './';
              `,
              output: `
                import a from 'foo';
                import type { A } from 'foo';
                import b from 'bar';
                import c from 'Bar';
                import type { C } from 'Bar';

                import index from './';
              `,
              parser,
              options: [
                {
                  groups: ['external', 'index'],
                  alphabetize: { order: 'desc' },
                },
              ],
              errors: [
                {
                  message: semver.satisfies(eslintPkg.version, '< 3')
                    ? '`bar` import should occur before import of `Bar`'
                    : /(`bar` import should occur before import of `Bar`)|(`Bar` import should occur after import of `bar`)/,
                },
              ],
            },
            parserConfig,
          ),
          // Option alphabetize: {order: 'asc'} with type group
          test(
            {
              code: `
                import b from 'bar';
                import c from 'Bar';
                import a from 'foo';

                import index from './';

                import type { A } from 'foo';
                import type { C } from 'Bar';
              `,
              output: `
                import c from 'Bar';
                import b from 'bar';
                import a from 'foo';

                import index from './';

                import type { C } from 'Bar';
                import type { A } from 'foo';
              `,
              parser,
              options: [
                {
                  groups: ['external', 'index', 'type'],
                  alphabetize: { order: 'asc' },
                },
              ],
              errors: semver.satisfies(eslintPkg.version, '< 3') ? [
                { message: '`Bar` import should occur before import of `bar`' },
                { message: '`Bar` import should occur before import of `foo`' },
              ] : [
                { message: /(`Bar` import should occur before import of `bar`)|(`bar` import should occur after import of `Bar`)/ },
                { message: /(`Bar` import should occur before import of `foo`)|(`foo` import should occur after import of `Bar`)/ },
              ],
            },
            parserConfig,
          ),
          // Option alphabetize: {order: 'desc'} with type group
          test(
            {
              code: `
                import a from 'foo';
                import c from 'Bar';
                import b from 'bar';

                import index from './';

                import type { C } from 'Bar';
                import type { A } from 'foo';
              `,
              output: `
                import a from 'foo';
                import b from 'bar';
                import c from 'Bar';

                import index from './';

                import type { A } from 'foo';
                import type { C } from 'Bar';
              `,
              parser,
              options: [
                {
                  groups: ['external', 'index', 'type'],
                  alphabetize: { order: 'desc' },
                },
              ],
              errors: semver.satisfies(eslintPkg.version, '< 3') ? [
                { message: '`bar` import should occur before import of `Bar`' },
                { message: '`foo` import should occur before import of `Bar`' },
              ] : [
                { message: /(`bar` import should occur before import of `Bar`)|(`Bar` import should occur after import of `bar`)/ },
                { message: /(`foo` import should occur before import of `Bar`)|(`Bar` import should occur after import of `foo`)/ },
              ],
            },
            parserConfig,
          ),
          // warns for out of order unassigned imports (warnOnUnassignedImports enabled)
          test({
            code: `
              import './local1';
              import global from 'global1';
              import local from './local2';
              import 'global2';
            `,
            output: `
              import './local1';
              import global from 'global1';
              import local from './local2';
              import 'global2';
            `,
            errors: [
              {
                message: '`global1` import should occur before import of `./local1`',
              },
              {
                message: '`global2` import should occur before import of `./local1`',
              },
            ],
            options: [{ warnOnUnassignedImports: true }],
          }),
          // fix cannot move below unassigned import (warnOnUnassignedImports enabled)
          test({
            code: `
              import local from './local';

              import 'global1';

              import global2 from 'global2';
              import global3 from 'global3';
            `,
            output: `
              import local from './local';

              import 'global1';

              import global2 from 'global2';
              import global3 from 'global3';
            `,
            errors: [{
              message: '`./local` import should occur after import of `global3`',
            }],
            options: [{ warnOnUnassignedImports: true }],
          }),
        ],
      });
    });
});
