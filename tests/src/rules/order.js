import { test, getTSParsers, getNonDefaultParsers, testFilePath, parsers } from '../utils';

import { RuleTester, withoutAutofixOutput } from '../rule-tester';
import eslintPkg from 'eslint/package.json';
import semver from 'semver';
import flatMap from 'array.prototype.flatmap';
import { resolve } from 'path';
import isCoreModule from 'is-core-module';
import { default as babelPresetFlow } from 'babel-preset-flow';

const ruleTester = new RuleTester();
const flowRuleTester = new RuleTester({
  parser: resolve(__dirname, '../../../node_modules/babel-eslint'),
  parserOptions: {
    babelOptions: {
      configFile: false,
      babelrc: false,
      presets: [babelPresetFlow],
    },
  },
});
const rule = require('rules/order');

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
    // Grouping import types and alphabetize
    test({
      code: `
        import async from 'async';
        import fs from 'fs';
        import path from 'path';

        import index from '.';
        import relParent3 from '../';
        import relParent1 from '../foo';
        import sibling from './foo';
      `,
      options: [{ groups: [
        ['builtin', 'external'],
      ], alphabetize: { order: 'asc', caseInsensitive: true } }],
    }),
    test({
      code: `
      import { fooz } from '../baz.js'
      import { foo } from './bar.js'
      `,
      options: [{
        alphabetize: { order: 'asc', caseInsensitive: true },
        groups: ['builtin', 'external', 'internal', ['parent', 'sibling', 'index'], 'object'],
        'newlines-between': 'always',
        warnOnUnassignedImports: true,
      }],
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
    ...flatMap(getTSParsers(), (parser) => [
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
        groups: ['unknown', 'builtin', 'external', 'parent', 'sibling', 'index'],
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
    // Using pathGroups (a test case for https://github.com/import-js/eslint-plugin-import/pull/1724)
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
    // Option newlines-between: 'always' with multi-line imports #1
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
    // Option newlines-between: 'always' with multi-line imports #2
    test({
      code: `
        import path from 'path';
        import net
          from 'net';

        import external from 'external'
      `,
      options: [{ 'newlines-between': 'always' }],
    }),
    // Option newlines-between: 'always' with multi-line imports #3
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
    // Option newlines-between: 'always-and-inside-groups' and consolidateIslands: true
    test({
      code: `
        var fs = require('fs');
        var path = require('path');
        var util = require('util');

        var async = require('async');

        var relParent1 = require('../foo');

        var {
          relParent2 } = require('../');

        var relParent3 = require('../bar');

        var sibling = require('./foo');
        var sibling2 = require('./bar');
        var sibling3 = require('./foobar');
      `,
      options: [
        {
          'newlines-between': 'always-and-inside-groups',
          consolidateIslands: 'inside-groups',
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
    // Option alphabetize: {order: 'asc'} and move nested import entries closer to the main import entry
    test({
      code: `
        import a from "foo";
        import c from "foo/bar";
        import d from "foo/barfoo";
        import b from "foo-bar";
      `,
      options: [{ alphabetize: { order: 'asc' } }],
    }),
    // Option alphabetize: {order: 'asc'} and move nested import entries closer to the main import entry
    test({
      code: `
        import a from "foo";
        import c from "foo/foobar/bar";
        import d from "foo/foobar/barfoo";
        import b from "foo-bar";
      `,
      options: [{ alphabetize: { order: 'asc' } }],
    }),
    // Option alphabetize: {order: 'desc'} and move nested import entries closer to the main import entry
    test({
      code: `
        import b from "foo-bar";
        import d from "foo/barfoo";
        import c from "foo/bar";
        import a from "foo";
      `,
      options: [{ alphabetize: { order: 'desc' } }],
    }),
    // Option alphabetize: {order: 'desc'} and move nested import entries closer to the main import entry with file names having non-alphanumeric characters.
    test({
      code: `
        import b from "foo-bar";
        import c from "foo,bar";
        import d from "foo/barfoo";
        import a from "foo";`,
      options: [{
        alphabetize: { order: 'desc' },
      }],
    }),
    // Option alphabetize: {order: 'asc'} with orderByFullPathString: true`
    test({
      code: `
        import a from "foo";
        import b from "foo-bar";
        import c from "foo/bar";
        import d from "foo/barfoo";
      `,
      options: [{ alphabetize: { order: 'asc' }, orderByFullPathString: true }],
    }),
    // Option alphabetize: {order: 'asc'} with orderByFullPathString: true
    test({
      code: `
        import a from "foo";
        import b from "foo-bar";
        import c from "foo/foobar/bar";
        import d from "foo/foobar/barfoo";
      `,
      options: [{ alphabetize: { order: 'asc' }, orderByFullPathString: true }],
    }),
    // Option alphabetize: {order: 'desc'} with orderByFullPathString: true
    test({
      code: `
        import d from "foo/barfoo";
        import c from "foo/bar";
        import b from "foo-bar";
        import a from "foo";
      `,
      options: [{ alphabetize: { order: 'desc' }, orderByFullPathString: true }],
    }),
    // Option alphabetize: {order: 'desc'} with orderByFullPathString: true and file names having non-alphanumeric characters.
    test({
      code: `
        import d from "foo/barfoo";
        import b from "foo-bar";
        import c from "foo,bar";
        import a from "foo";`,
      options: [{
        alphabetize: { order: 'desc' },
        orderByFullPathString: true,
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
    ...flatMap(getTSParsers, (parser) => [
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
    // Using `@/*` to alias internal modules
    test({
      code: `
        import fs from 'fs';

        import express from 'express';

        import service from '@/api/service';

        import fooParent from '../foo';

        import fooSibling from './foo';

        import index from './';

        import internalDoesNotExistSoIsUnknown from '@/does-not-exist';
      `,
      options: [
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'unknown'],
          'newlines-between': 'always',
        },
      ],
      settings: {
        'import/resolver': {
          webpack: {
            config: {
              resolve: {
                alias: {
                  '@': testFilePath('internal-modules'),
                },
              },
            },
          },
        },
      },
    }),
    // Option pathGroup[].distinctGroup: 'true' does not prevent 'position' properties from affecting the visible grouping
    test({
      code: `
        import A from 'a';

        import C from 'c';

        import B from 'b';
      `,
      options: [
        {
          'newlines-between': 'always',
          distinctGroup: true,
          pathGroupsExcludedImportTypes: [],
          pathGroups: [
            {
              pattern: 'a',
              group: 'external',
              position: 'before',
            },
            {
              pattern: 'b',
              group: 'external',
              position: 'after',
            },
          ],
        },
      ],
    }),
    // Option pathGroup[].distinctGroup: 'false' should prevent 'position' properties from affecting the visible grouping
    test({
      code: `
        import A from 'a';
        import C from 'c';
        import B from 'b';
      `,
      options: [
        {
          'newlines-between': 'always',
          distinctGroup: false,
          pathGroupsExcludedImportTypes: [],
          pathGroups: [
            {
              pattern: 'a',
              group: 'external',
              position: 'before',
            },
            {
              pattern: 'b',
              group: 'external',
              position: 'after',
            },
          ],
        },
      ],
    }),
    // Option pathGroup[].distinctGroup: 'false' should prevent 'position' properties from affecting the visible grouping 2
    test({
      code: `
        import A from 'a';

        import b from './b';
        import B from './B';
      `,
      options: [
        {
          'newlines-between': 'always',
          distinctGroup: false,
          pathGroupsExcludedImportTypes: [],
          pathGroups: [
            {
              pattern: 'a',
              group: 'external',
            },
            {
              pattern: 'b',
              group: 'internal',
              position: 'before',
            },
          ],
        },
      ],
    }),
    // Option pathGroup[].distinctGroup: 'false' should prevent 'position' properties from affecting the visible grouping 3
    test({
      code: `
        import A from "baz";
        import B from "Bar";
        import C from "Foo";

        import D from "..";
        import E from "../";
        import F from "../baz";
        import G from "../Bar";
        import H from "../Foo";

        import I from ".";
        import J from "./baz";
        import K from "./Bar";
        import L from "./Foo";
      `,
      options: [
        {
          alphabetize: {
            caseInsensitive: false,
            order: 'asc',
          },
          'newlines-between': 'always',
          groups: [
            ['builtin', 'external', 'internal', 'unknown', 'object', 'type'],
            'parent',
            ['sibling', 'index'],
          ],
          distinctGroup: false,
          pathGroupsExcludedImportTypes: [],
          pathGroups: [
            {
              pattern: './',
              group: 'sibling',
              position: 'before',
            },
            {
              pattern: '.',
              group: 'sibling',
              position: 'before',
            },
            {
              pattern: '..',
              group: 'parent',
              position: 'before',
            },
            {
              pattern: '../',
              group: 'parent',
              position: 'before',
            },
            {
              pattern: '[a-z]*',
              group: 'external',
              position: 'before',
            },
            {
              pattern: '../[a-z]*',
              group: 'parent',
              position: 'before',
            },
            {
              pattern: './[a-z]*',
              group: 'sibling',
              position: 'before',
            },
          ],
        },
      ],
    }),
    // orderImportKind option that is not used
    test({
      code: `
        import B from './B';
        import b from './b';
      `,
      options: [
        {
          alphabetize: { order: 'asc', orderImportKind: 'asc', caseInsensitive: true },
        },
      ],
    }),
    // named import order
    test({
      code: `
        import { a, B as C, Z } from './Z';
        const { D, n: c, Y } = require('./Z');
        export { C, D };
        export { A, B, C as default } from "./Z";

        const { ["ignore require-statements with non-identifier imports"]: z, d } = require("./Z");
        exports = { ["ignore exports statements with non-identifiers"]: Z, D };
      `,
      options: [{
        named: true,
        alphabetize: { order: 'asc', caseInsensitive: true },
      }],
    }),
    test({
      code: `
        const { b, A } = require('./Z');
      `,
      options: [{
        named: true,
        alphabetize: { order: 'desc' },
      }],
    }),
    test({
      code: `
        import { A, B } from "./Z";
        export { Z, A } from "./Z";
        export { N, P } from "./Z";
        const { X, Y } = require("./Z");
      `,
      options: [{
        named: {
          require: true,
          import: true,
          export: false,
        },
      }],
    }),
    test({
      code: `
        import { B, A } from "./Z";
        const { D, C } = require("./Z");
        export { B, A } from "./Z";
      `,
      options: [{
        named: {
          require: false,
          import: false,
          export: false,
        },
      }],
    }),
    test({
      code: `
        import { B, A, R } from "foo";
        const { D, O, G } = require("tunes");
        export { B, A, Z } from "foo";
      `,
      options: [{
        named: { enabled: false },
      }],
    }),
    test({
      code: `
        import { A as A, A as B, A as C } from "./Z";
        const { a, a: b, a: c } = require("./Z");
      `,
      options: [{
        named: true,
      }],
    }),
    test({
      code: `
        import { A, B, C } from "./Z";
        exports = { A, B, C };
        module.exports = { a: A, b: B, c: C };
      `,
      options: [{
        named: {
          cjsExports: true,
        },
        alphabetize: { order: 'asc' },
      }],
    }),
    test({
      code: `
        module.exports.A = { };
        module.exports.A.B = { };
        module.exports.B = { };
        exports.C = { };
      `,
      options: [{
        named: {
          cjsExports: true,
        },
        alphabetize: { order: 'asc' },
      }],
    }),
    // ensure other assignments are untouched
    test({
      code: `
        var exports = null;
        var module = null;
        exports = { };
        module = { };
        module.exports = { };
        module.exports.U = { };
        module.exports.N = { };
        module.exports.C = { };
        exports.L = { };
        exports.E = { };
      `,
      options: [{
        named: {
          cjsExports: true,
        },
        alphabetize: { order: 'asc' },
      }],
    }),
    test({
      code: `
        exports["B"] = { };
        exports["C"] = { };
        exports["A"] = { };
      `,
      options: [{
        named: {
          cjsExports: true,
        },
        alphabetize: { order: 'asc' },
      }],
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
      code: `/* comment0 */  /* comment1 */  var async = require('async'); /* comment2 */` + `\r\n` + `/* comment3 */  var fs = require('fs'); /* comment4 */` + `\r\n`,
      output: `/* comment3 */  var fs = require('fs'); /* comment4 */` + `\r\n` + `/* comment0 */  /* comment1 */  var async = require('async'); /* comment2 */` + `\r\n`,
      errors: [{
        message: '`fs` import should occur before import of `async`',
      }],
    }),
    // fix order with multi-lines comments at the end and start of line
    test({
      code: `
        /* multi-line1
          comment1 */  var async = require('async'); /* multi-line2
          comment2 */  var fs = require('fs'); /* multi-line3
          comment3 */
      `,
      output: `
        /* multi-line1
          comment1 */  var fs = require('fs');` + ' '  + `
  var async = require('async'); /* multi-line2
          comment2 *//* multi-line3
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
    // fix order of multi-line import
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
    ...flatMap(getTSParsers(), (parser) => [
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
    // Cannot fix newlines-between with multi-line comment after
    test(withoutAutofixOutput({
      code: `
        var fs = require('fs'); /* multi-line
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
    })),
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
    test(withoutAutofixOutput({
      code: `
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
    })),
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
    test(withoutAutofixOutput({
      code: `
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
    })),
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
    test(withoutAutofixOutput({
      code: `
        const local = require('./local');

        fn_call();

        const global1 = require('global1');
        const global2 = require('global2');

        fn_call();
      `,
      errors: [{
        message: '`./local` import should occur after import of `global2`',
      }],
    })),
    // reorder fix cannot cross function call on moving below #2
    test(withoutAutofixOutput({
      code: `
        const local = require('./local');
        fn_call();
        const global1 = require('global1');
        const global2 = require('global2');

        fn_call();
      `,
      errors: [{
        message: '`./local` import should occur after import of `global2`',
      }],
    })),
    // reorder fix cannot cross function call on moving below #3
    test(withoutAutofixOutput({
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
      errors: [
        '`./local1` import should occur after import of `global5`',
        '`./local2` import should occur after import of `global5`',
        '`./local3` import should occur after import of `global5`',
        '`./local4` import should occur after import of `global5`',
      ],
    })),
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

    // pathGroups overflowing to previous/next groups
    test({
      code: `
        import path from 'path';
        import { namespace } from '@namespace';
        import { a } from 'a';
        import { b } from 'b';
        import { c } from 'c';
        import { d } from 'd';
        import { e } from 'e';
        import { f } from 'f';
        import { g } from 'g';
        import { h } from 'h';
        import { i } from 'i';
        import { j } from 'j';
        import { k } from 'k';`,
      output: `
        import path from 'path';

        import { namespace } from '@namespace';

        import { a } from 'a';

        import { b } from 'b';

        import { c } from 'c';

        import { d } from 'd';

        import { e } from 'e';

        import { f } from 'f';

        import { g } from 'g';

        import { h } from 'h';

        import { i } from 'i';

        import { j } from 'j';
        import { k } from 'k';`,
      options: [
        {
          groups: [
            'builtin',
            'external',
            'internal',
          ],
          pathGroups: [
            { pattern: '@namespace', group: 'external', position: 'after' },
            { pattern: 'a', group: 'internal', position: 'before' },
            { pattern: 'b', group: 'internal', position: 'before' },
            { pattern: 'c', group: 'internal', position: 'before' },
            { pattern: 'd', group: 'internal', position: 'before' },
            { pattern: 'e', group: 'internal', position: 'before' },
            { pattern: 'f', group: 'internal', position: 'before' },
            { pattern: 'g', group: 'internal', position: 'before' },
            { pattern: 'h', group: 'internal', position: 'before' },
            { pattern: 'i', group: 'internal', position: 'before' },
          ],
          'newlines-between': 'always',
          pathGroupsExcludedImportTypes: ['builtin'],
        },
      ],
      settings: {
        'import/internal-regex': '^(a|b|c|d|e|f|g|h|i|j|k)(\\/|$)',
      },
      errors: Array.from({ length: 11 }, () => 'There should be at least one empty line between import groups'),
    }),

    // rankings that overflow to double-digit ranks
    test({
      code: `
        import external from 'external';
        import a from '@namespace/a';
        import b from '@namespace/b';
        import { parent } from '../../parent';
        import local from './local';
        import './side-effect';`,
      output: `
        import external from 'external';

        import a from '@namespace/a';
        import b from '@namespace/b';

        import { parent } from '../../parent';

        import local from './local';
        import './side-effect';`,
      options: [
        {
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
          groups: ['type', 'builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'object'],
          'newlines-between': 'always',
          pathGroups: [
            { pattern: '@namespace', group: 'external', position: 'after' },
            { pattern: '@namespace/**', group: 'external', position: 'after' },
          ],
          pathGroupsExcludedImportTypes: [],
        },
      ],
      errors: [
        'There should be at least one empty line between import groups',
        'There should be at least one empty line between import groups',
        'There should be at least one empty line between import groups',
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
    test(withoutAutofixOutput({
      code: `
        const env = require('./config');

        Object.keys(env);

        const http = require('http');
        const express = require('express');

        http.createServer(express());
      `,
      errors: [{
        message: '`./config` import should occur after import of `express`',
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
    // Option alphabetize: {order: 'asc'} and move nested import entries closer to the main import entry
    test({
      code: `
        import a from "foo";
        import b from "foo-bar";
        import c from "foo/bar";
        import d from "foo/barfoo";
      `,
      options: [{
        alphabetize: { order: 'asc' },
      }],
      output: `
        import a from "foo";
        import c from "foo/bar";
        import d from "foo/barfoo";
        import b from "foo-bar";
      `,
      errors: [{
        message: '`foo-bar` import should occur after import of `foo/barfoo`',
      }],
    }),
    // Option alphabetize: {order: 'asc'} with orderByFullPathString: true
    test({
      code: `
        import a from "foo";
        import c from "foo/bar";
        import d from "foo/barfoo";
        import b from "foo-bar";
      `,
      options: [{
        alphabetize: { order: 'asc' },
        orderByFullPathString: true,
      }],
      output: `
        import a from "foo";
        import b from "foo-bar";
        import c from "foo/bar";
        import d from "foo/barfoo";
      `,
      errors: [{
        message: '`foo/barfoo` import should occur after import of `foo-bar`',
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
    // Option alphabetize {order: 'asc'} and require with member expression
    test({
      code: `
        const b = require('./b').get();
        const a = require('./a');
      `,
      output: `
        const a = require('./a');
        const b = require('./b').get();
      `,
      options: [{
        alphabetize: { order: 'asc' },
      }],
      errors: [{
        message: '`./a` import should occur before import of `./b`',
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
    // Option pathGroup[].distinctGroup: 'false' should error when newlines are incorrect 2
    test({
      code: `
        import A from 'a';
        import C from './c';
      `,
      output: `
        import A from 'a';

        import C from './c';
      `,
      options: [
        {
          'newlines-between': 'always',
          distinctGroup: false,
          pathGroupsExcludedImportTypes: [],
        },
      ],
      errors: [{
        message: 'There should be at least one empty line between import groups',
      }],
    }),
    // Option pathGroup[].distinctGroup: 'false' should error when newlines are incorrect 2
    test({
      code: `
        import A from 'a';

        import C from 'c';
      `,
      output: `
        import A from 'a';
        import C from 'c';
      `,
      options: [
        {
          'newlines-between': 'always',
          distinctGroup: false,
          pathGroupsExcludedImportTypes: [],
          pathGroups: [
            {
              pattern: 'a',
              group: 'external',
              position: 'before',
            },
            {
              pattern: 'c',
              group: 'external',
              position: 'after',
            },
          ],
        },
      ],
      errors: [{
        message: 'There should be no empty line within import group',
      }],
    }),
    // named import order
    test({
      code: `
        var { B, A: R } = require("./Z");
        import { O as G, D } from "./Z";
        import { K, L, J } from "./Z";
        export { Z, X, Y } from "./Z";
      `,
      output: `
        var { A: R, B } = require("./Z");
        import { D, O as G } from "./Z";
        import { J, K, L } from "./Z";
        export { X, Y, Z } from "./Z";
      `,
      options: [{
        named: true,
        alphabetize: { order: 'asc' },
      }],
      errors: [{
        message: '`A` import should occur before import of `B`',
      }, {
        message: '`D` import should occur before import of `O`',
      }, {
        message: '`J` import should occur before import of `K`',
      }, {
        message: '`Z` export should occur after export of `Y`',
      }],
    }),
    test({
      code: `
        import { D, C } from "./Z";
        var { B, A } = require("./Z");
        export { B, A };
      `,
      output: `
        import { C, D } from "./Z";
        var { B, A } = require("./Z");
        export { A, B };
      `,
      options: [{
        named: {
          require: false,
          import: true,
          export: true,
        },
        alphabetize: { order: 'asc' },
      }],
      errors: [{
        message: '`C` import should occur before import of `D`',
      }, {
        message: '`A` export should occur before export of `B`',
      }],
    }),
    test({
      code: `
        import { A as B, A as C, A } from "./Z";
        export { A, A as D, A as B, A as C } from "./Z";
        const { a: b, a: c, a } = require("./Z");
      `,
      output: `
        import { A, A as B, A as C } from "./Z";
        export { A, A as B, A as C, A as D } from "./Z";
        const { a, a: b, a: c } = require("./Z");
      `,
      options: [{
        named: true,
        alphabetize: { order: 'asc' },
      }],
      errors: [{
        message: '`A` import should occur before import of `A as B`',
      }, {
        message: '`A as D` export should occur after export of `A as C`',
      }, {
        message: '`a` import should occur before import of `a as b`',
      }],
    }),
    test({
      code: `
        import { A, B, C } from "./Z";
        exports = { B, C, A };
        module.exports = { c: C, a: A, b: B };
      `,
      output: `
        import { A, B, C } from "./Z";
        exports = { A, B, C };
        module.exports = { a: A, b: B, c: C };
      `,
      options: [{
        named: {
          cjsExports: true,
        },
        alphabetize: { order: 'asc' },
      }],
      errors: [{
        message: '`A` export should occur before export of `B`',
      }, {
        message: '`c` export should occur after export of `b`',
      }],
    }),
    test({
      code: `
        exports.B = { };
        module.exports.A = { };
        module.exports.C = { };
      `,
      output: `
        module.exports.A = { };
        exports.B = { };
        module.exports.C = { };
      `,
      options: [{
        named: {
          cjsExports: true,
        },
        alphabetize: { order: 'asc' },
      }],
      errors: [{
        message: '`A` export should occur before export of `B`',
      }],
    }),
    test({
      code: `
        exports.A.C = { };
        module.exports.A.A = { };
        exports.A.B = { };
      `,
      output: `
        module.exports.A.A = { };
        exports.A.B = { };
        exports.A.C = { };
      `,
      options: [{
        named: {
          cjsExports: true,
        },
        alphabetize: { order: 'asc' },
      }],
      errors: [{
        message: '`A.C` export should occur after export of `A.B`',
      }],
    }),
    // multi-line named specifiers & trailing commas
    test({
      code: `
        const {
          F: O,
          O: B,
          /* Hello World */
          A: R
        } = require("./Z");
        import {
          Y,
          X,
        } from "./Z";
        export {
          Z, A,
          B
        } from "./Z";
        module.exports = {
          a: A, o: O,
          b: B
        };
      `,
      output: `
        const {
          /* Hello World */
          A: R,
          F: O,
          O: B
        } = require("./Z");
        import {
          X,
          Y,
        } from "./Z";
        export { A,
          B,
          Z
        } from "./Z";
        module.exports = {
          a: A,
          b: B, o: O
        };
      `,
      options: [{
        named: {
          enabled: true,
        },
        alphabetize: { order: 'asc' },
      }],
      errors: [{
        message: '`A` import should occur before import of `F`',
      }, {
        message: '`X` import should occur before import of `Y`',
      }, {
        message: '`Z` export should occur after export of `B`',
      }, {
        message: '`b` export should occur before export of `o`',
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
    // Option newlines-between: 'always-and-inside-groups' and consolidateIslands: true
    test({
      code: `
        var fs = require('fs');
        var path = require('path');
        var { util1, util2, util3 } = require('util');
        var async = require('async');
        var relParent1 = require('../foo');
        var {
          relParent21,
          relParent22,
          relParent23,
          relParent24,
        } = require('../');
        var relParent3 = require('../bar');
        var { sibling1,
          sibling2, sibling3 } = require('./foo');
        var sibling2 = require('./bar');
        var sibling3 = require('./foobar');
      `,
      output: `
        var fs = require('fs');
        var path = require('path');
        var { util1, util2, util3 } = require('util');

        var async = require('async');

        var relParent1 = require('../foo');

        var {
          relParent21,
          relParent22,
          relParent23,
          relParent24,
        } = require('../');

        var relParent3 = require('../bar');

        var { sibling1,
          sibling2, sibling3 } = require('./foo');

        var sibling2 = require('./bar');
        var sibling3 = require('./foobar');
      `,
      options: [
        {
          'newlines-between': 'always-and-inside-groups',
          consolidateIslands: 'inside-groups',
        },
      ],
      errors: [
        {
          message: 'There should be at least one empty line between import groups',
          line: 4,
        },
        {
          message: 'There should be at least one empty line between import groups',
          line: 5,
        },
        {
          message: 'There should be at least one empty line between this import and the multi-line import that follows it',
          line: 6,
        },
        {
          message: 'There should be at least one empty line between this multi-line import and the import that follows it',
          line: 12,
        },
        {
          message: 'There should be at least one empty line between import groups',
          line: 13,
        },
        {
          message: 'There should be at least one empty line between this multi-line import and the import that follows it',
          line: 15,
        },
      ],
    }),
    test({
      code: `
        var fs = require('fs');

        var path = require('path');

        var { util1, util2, util3 } = require('util');

        var async = require('async');

        var relParent1 = require('../foo');

        var {
          relParent21,
          relParent22,
          relParent23,
          relParent24,
        } = require('../');

        var relParent3 = require('../bar');

        var { sibling1,
          sibling2, sibling3 } = require('./foo');

        var sibling2 = require('./bar');

        var sibling3 = require('./foobar');
      `,
      output: `
        var fs = require('fs');
        var path = require('path');
        var { util1, util2, util3 } = require('util');

        var async = require('async');

        var relParent1 = require('../foo');

        var {
          relParent21,
          relParent22,
          relParent23,
          relParent24,
        } = require('../');

        var relParent3 = require('../bar');

        var { sibling1,
          sibling2, sibling3 } = require('./foo');

        var sibling2 = require('./bar');
        var sibling3 = require('./foobar');
      `,
      options: [
        {
          'newlines-between': 'always-and-inside-groups',
          consolidateIslands: 'inside-groups',
        },
      ],
      errors: [
        {
          message: 'There should be no empty lines between this single-line import and the single-line import that follows it',
          line: 2,
        },
        {
          message: 'There should be no empty lines between this single-line import and the single-line import that follows it',
          line: 4,
        },
        {
          message: 'There should be no empty lines between this single-line import and the single-line import that follows it',
          line: 24,
        },
      ],
    }),
  ].filter(Boolean),
});

context('TypeScript', function () {
  getNonDefaultParsers()
    // Type-only imports were added in TypeScript ESTree 2.23.0
    .filter((parser) => parser !== parsers.TS_OLD)
    .forEach((parser) => {
      const supportsTypeSpecifiers = semver.satisfies(require('@typescript-eslint/parser/package.json').version, '>= 5');
      const supportsImportTypeSpecifiers = parser !== parsers.TS_NEW || supportsTypeSpecifiers;
      const supportsExportTypeSpecifiers = parser === parsers.TS_NEW && supportsTypeSpecifiers;
      const parserConfig = {
        parser,
        settings: {
          'import/parsers': { [parser]: ['.ts'] },
          'import/resolver': { 'eslint-import-resolver-typescript': true },
        },
      };

      ruleTester.run('order', rule, {
        valid: [].concat(
          // #1667: typescript type import support

          // Option alphabetize: {order: 'asc'}
          test({
            code: `
              import c from 'Bar';
              import type { C } from 'Bar';
              import b from 'bar';
              import a from 'foo';
              import type { A } from 'foo';

              import index from './';
            `,
            ...parserConfig,
            options: [
              {
                groups: ['external', 'index'],
                alphabetize: { order: 'asc' },
              },
            ],
          }),
          // Option alphabetize: {order: 'desc'}
          test({
            code: `
              import a from 'foo';
              import type { A } from 'foo';
              import b from 'bar';
              import c from 'Bar';
              import type { C } from 'Bar';

              import index from './';
            `,
            ...parserConfig,
            options: [
              {
                groups: ['external', 'index'],
                alphabetize: { order: 'desc' },
              },
            ],
          }),
          // Option alphabetize: {order: 'asc'} with type group
          test({
            code: `
              import c from 'Bar';
              import b from 'bar';
              import a from 'foo';

              import index from './';

              import type { C } from 'Bar';
              import type { A } from 'foo';
            `,
            ...parserConfig,
            options: [
              {
                groups: ['external', 'index', 'type'],
                alphabetize: { order: 'asc' },
              },
            ],
          }),
          // Option alphabetize: {order: 'asc'} with type group & path group
          test({
            code: `
              import c from 'Bar';
              import a from 'foo';

              import b from 'dirA/bar';

              import index from './';

              import type { C } from 'dirA/Bar';
              import type { A } from 'foo';
            `,
            ...parserConfig,
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
          }),
          // Option alphabetize: {order: 'asc'} with path group
          test({
            code: `
              import c from 'Bar';
              import type { A } from 'foo';
              import a from 'foo';

              import type { C } from 'dirA/Bar';
              import b from 'dirA/bar';

              import index from './';
            `,
            ...parserConfig,
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
          }),
          // Option alphabetize: {order: 'desc'} with type group
          test({
            code: `
              import a from 'foo';
              import b from 'bar';
              import c from 'Bar';

              import index from './';

              import type { A } from 'foo';
              import type { C } from 'Bar';
            `,
            ...parserConfig,
            options: [
              {
                groups: ['external', 'index', 'type'],
                alphabetize: { order: 'desc' },
              },
            ],
          }),
          test({
            code: `
              import { Partner } from '@models/partner/partner';
              import { PartnerId } from '@models/partner/partner-id';
            `,
            ...parserConfig,
            options: [
              {
                alphabetize: { order: 'asc' },
              },
            ],
          }),
          test({
            code: `
              import { serialize, parse, mapFieldErrors } from '@vtaits/form-schema';
              import type { GetFieldSchema } from '@vtaits/form-schema';
              import { useMemo, useCallback } from 'react';
              import type { ReactElement, ReactNode } from 'react';
              import { Form } from 'react-final-form';
              import type { FormProps as FinalFormProps } from 'react-final-form';
            `,
            ...parserConfig,
            options: [
              {
                alphabetize: { order: 'asc' },
              },
            ],
          }),
          // Imports inside module declaration
          test({
            code: `
              import type { CopyOptions } from 'fs';
              import type { ParsedPath } from 'path';

              declare module 'my-module' {
                import type { CopyOptions } from 'fs';
                import type { ParsedPath } from 'path';
              }
            `,
            ...parserConfig,
            options: [
              {
                alphabetize: { order: 'asc' },
              },
            ],
          }),
          test({
            code: `
              import { useLazyQuery, useQuery } from "@apollo/client";
              import { useEffect } from "react";
            `,
            options: [
              {
                groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'object', 'type'],
                pathGroups: [
                  {
                    pattern: 'react',
                    group: 'external',
                    position: 'before',
                  },
                ],
                'newlines-between': 'always',
                alphabetize: {
                  order: 'asc',
                  caseInsensitive: true,
                },
              },
            ],
          }),
          isCoreModule('node:child_process') && isCoreModule('node:fs/promises') ? [
            test({
              code: `
                import express from 'express';
                import log4js from 'log4js';
                import chpro from 'node:child_process';
                // import fsp from 'node:fs/promises';
              `,
              options: [{
                groups: [
                  [
                    'builtin',
                    'external',
                    'internal',
                    'parent',
                    'sibling',
                    'index',
                    'object',
                    'type',
                  ],
                ],
              }],
            }),
          ] : [],
          // Option sortTypesGroup: false (default)
          test({
            code: `
              import c from 'Bar';
              import a from 'foo';

              import type { C } from 'dirA/Bar';
              import b from 'dirA/bar';
              import type { D } from 'dirA/bar';

              import index from './';

              import type { AA } from 'abc';
              import type { A } from 'foo';
            `,
            ...parserConfig,
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
                pathGroupsExcludedImportTypes: [],
              },
            ],
          }),
          test({
            code: `
              import c from 'Bar';
              import a from 'foo';

              import type { C } from 'dirA/Bar';
              import b from 'dirA/bar';
              import type { D } from 'dirA/bar';

              import index from './';

              import type { AA } from 'abc';
              import type { A } from 'foo';
            `,
            ...parserConfig,
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
                pathGroupsExcludedImportTypes: [],
                sortTypesGroup: false,
              },
            ],
          }),
          // Option sortTypesGroup: true and 'type' in pathGroupsExcludedImportTypes
          test({
            code: `
              import c from 'Bar';
              import a from 'foo';

              import b from 'dirA/bar';

              import index from './';

              import type { AA } from 'abc';
              import type { C } from 'dirA/Bar';
              import type { D } from 'dirA/bar';
              import type { A } from 'foo';
            `,
            ...parserConfig,
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
                sortTypesGroup: true,
              },
            ],
          }),
          test({
            code: `
              import c from 'Bar';
              import type { AA } from 'abc';
              import a from 'foo';
              import type { A } from 'foo';

              import type { C } from 'dirA/Bar';
              import b from 'dirA/bar';
              import type { D } from 'dirA/bar';

              import index from './';
            `,
            ...parserConfig,
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
          }),
          // Option sortTypesGroup: true and newlines-between-types defaults to the value of newlines-between
          test({
            code: `
              import c from 'Bar';
              import a from 'foo';

              import b from 'dirA/bar';

              import index from './';

              import type { AA } from 'abc';
              import type { A } from 'foo';

              import type { C } from 'dirA/Bar';
              import type { D } from 'dirA/bar';
            `,
            ...parserConfig,
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
                pathGroupsExcludedImportTypes: [],
                sortTypesGroup: true,
              },
            ],
          }),
          // Option: sortTypesGroup: true and newlines-between-types: 'always' (takes precedence over newlines-between between type-only and normal imports)
          test({
            code: `
              import c from 'Bar';
              import a from 'foo';
              import b from 'dirA/bar';
              import index from './';

              import type { AA } from 'abc';
              import type { A } from 'foo';

              import type { C } from 'dirA/Bar';
              import type { D } from 'dirA/bar';
            `,
            ...parserConfig,
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
                'newlines-between': 'never',
                'newlines-between-types': 'always',
                pathGroupsExcludedImportTypes: [],
                sortTypesGroup: true,
              },
            ],
          }),
          // Option: sortTypesGroup: true and newlines-between-types: 'never' (takes precedence over newlines-between between type-only and normal imports)
          test({
            code: `
              import c from 'Bar';
              import a from 'foo';

              import b from 'dirA/bar';

              import index from './';
              import type { AA } from 'abc';
              import type { A } from 'foo';
              import type { C } from 'dirA/Bar';
              import type { D } from 'dirA/bar';
            `,
            ...parserConfig,
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
                'newlines-between-types': 'never',
                pathGroupsExcludedImportTypes: [],
                sortTypesGroup: true,
              },
            ],
          }),
          // Option: sortTypesGroup: true and newlines-between-types: 'ignore'
          test({
            code: `
              import c from 'Bar';
              import a from 'foo';
              import b from 'dirA/bar';
              import index from './';
              import type { AA } from 'abc';

              import type { A } from 'foo';
              import type { C } from 'dirA/Bar';
              import type { D } from 'dirA/bar';
            `,
            ...parserConfig,
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
                'newlines-between': 'never',
                'newlines-between-types': 'ignore',
                pathGroupsExcludedImportTypes: [],
                sortTypesGroup: true,
              },
            ],
          }),
          // Option: sortTypesGroup: true and newlines-between-types: 'always-and-inside-groups'
          test({
            code: `
              import c from 'Bar';
              import a from 'foo';
              import b from 'dirA/bar';
              import index from './';

              import type { AA } from 'abc';

              import type { A } from 'foo';

              import type { C } from 'dirA/Bar';

              import type { D } from 'dirA/bar';
            `,
            ...parserConfig,
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
                'newlines-between': 'never',
                'newlines-between-types': 'always-and-inside-groups',
                pathGroupsExcludedImportTypes: [],
                sortTypesGroup: true,
              },
            ],
          }),
          // Option: sortTypesGroup: true puts type imports in the same order as regular imports (from issue #2441, PR #2615)
          test({
            code: `
              import type A from "fs";
              import type B from "path";
              import type C from "../foo.js";
              import type D from "./bar.js";
              import type E from './';

              import a from "fs";
              import b from "path";
              import c from "../foo.js";
              import d from "./bar.js";
              import e from "./";
            `,
            ...parserConfig,
            options: [
              {
                groups: ['type', 'builtin', 'parent', 'sibling', 'index'],
                alphabetize: {
                  order: 'asc',
                  caseInsensitive: true,
                },
                sortTypesGroup: true,
              },
            ],
          }),
          // Options: sortTypesGroup + newlines-between-types example #1 from the documentation (pass)
          test({
            code: `
              import type A from "fs";
              import type B from "path";
              import type C from "../foo.js";
              import type D from "./bar.js";
              import type E from './';

              import a from "fs";
              import b from "path";

              import c from "../foo.js";

              import d from "./bar.js";

              import e from "./";
            `,
            ...parserConfig,
            options: [
              {
                groups: ['type', 'builtin', 'parent', 'sibling', 'index'],
                sortTypesGroup: true,
                'newlines-between': 'always',
                'newlines-between-types': 'ignore',
              },
            ],
          }),
          test({
            code: `
              import a from "fs";
              import b from "path";

              import c from "../foo.js";

              import d from "./bar.js";

              import e from "./";

              import type A from "fs";
              import type B from "path";
              import type C from "../foo.js";
              import type D from "./bar.js";
              import type E from './';
            `,
            ...parserConfig,
            options: [
              {
                groups: ['builtin', 'parent', 'sibling', 'index', 'type'],
                sortTypesGroup: true,
                'newlines-between': 'always',
                'newlines-between-types': 'ignore',
              },
            ],
          }),
          // Options: sortTypesGroup + newlines-between-types example #2 from the documentation (pass)
          test({
            code: `
              import type A from "fs";
              import type B from "path";

              import type C from "../foo.js";

              import type D from "./bar.js";

              import type E from './';

              import a from "fs";
              import b from "path";
              import c from "../foo.js";
              import d from "./bar.js";
              import e from "./";
            `,
            ...parserConfig,
            options: [
              {
                groups: ['type', 'builtin', 'parent', 'sibling', 'index'],
                sortTypesGroup: true,
                'newlines-between': 'never',
                'newlines-between-types': 'always',
              },
            ],
          }),
          test({
            code: `
              import a from "fs";
              import b from "path";
              import c from "../foo.js";
              import d from "./bar.js";
              import e from "./";

              import type A from "fs";
              import type B from "path";

              import type C from "../foo.js";

              import type D from "./bar.js";

              import type E from './';
            `,
            ...parserConfig,
            options: [
              {
                groups: ['builtin', 'parent', 'sibling', 'index', 'type'],
                sortTypesGroup: true,
                'newlines-between': 'never',
                'newlines-between-types': 'always',
              },
            ],
          }),
          // Ensure the rule doesn't choke and die on absolute paths trying to pass NaN around
          test({
            code: `
              import fs from 'fs';

              import '@scoped/package';
              import type { B } from 'fs';

              import type { A1 } from '/bad/bad/bad/bad';
              import './a/b/c';
              import type { A2 } from '/bad/bad/bad/bad';
              import type { A3 } from '/bad/bad/bad/bad';
              import type { D1 } from '/bad/bad/not/good';
              import type { D2 } from '/bad/bad/not/good';
              import type { D3 } from '/bad/bad/not/good';

              import type { C } from '@something/else';

              import type { E } from './index.js';
            `,
            ...parserConfig,
            options: [
              {
                alphabetize: { order: 'asc' },
                groups: ['builtin', 'type', 'unknown', 'external'],
                sortTypesGroup: true,
                'newlines-between': 'always',
              },
            ],
          }),
          // Ensure the rule doesn't choke and die when right-hand-side AssignmentExpression properties lack a "key" attribute (e.g. SpreadElement)
          test({
            code: `
              // https://prettier.io/docs/en/options.html

              module.exports = {
                  ...require('@xxxx/.prettierrc.js'),
              };
            `,
            ...parserConfig,
            options: [{ named: { enabled: true } }],
          }),
          // Option: sortTypesGroup: true and newlines-between-types: 'always-and-inside-groups' and consolidateIslands: 'inside-groups'
          test({
            code: `
              import c from 'Bar';
              import d from 'bar';

              import {
                aa,
                bb,
                cc,
                dd,
                ee,
                ff,
                gg
              } from 'baz';

              import {
                hh,
                ii,
                jj,
                kk,
                ll,
                mm,
                nn
              } from 'fizz';

              import a from 'foo';

              import b from 'dirA/bar';

              import index from './';

              import type { AA,
                BB, CC } from 'abc';

              import type { Z } from 'fizz';

              import type {
                A,
                B
              } from 'foo';

              import type { C2 } from 'dirB/Bar';

              import type {
                D2,
                X2,
                Y2
              } from 'dirB/bar';

              import type { E2 } from 'dirB/baz';

              import type { C3 } from 'dirC/Bar';

              import type {
                D3,
                X3,
                Y3
              } from 'dirC/bar';

              import type { E3 } from 'dirC/baz';
              import type { F3 } from 'dirC/caz';

              import type { C1 } from 'dirA/Bar';

              import type {
                D1,
                X1,
                Y1
              } from 'dirA/bar';

              import type { E1 } from 'dirA/baz';

              import type { F } from './index.js';

              import type { G } from './aaa.js';
              import type { H } from './bbb';
            `,
            ...parserConfig,
            options: [
              {
                alphabetize: { order: 'asc' },
                groups: ['external', 'internal', 'index', 'type'],
                pathGroups: [
                  {
                    pattern: 'dirA/**',
                    group: 'internal',
                    position: 'after',
                  },
                  {
                    pattern: 'dirB/**',
                    group: 'internal',
                    position: 'before',
                  },
                  {
                    pattern: 'dirC/**',
                    group: 'internal',
                  },
                ],
                'newlines-between': 'always-and-inside-groups',
                'newlines-between-types': 'always-and-inside-groups',
                pathGroupsExcludedImportTypes: [],
                sortTypesGroup: true,
                consolidateIslands: 'inside-groups',
              },
            ],
          }),
          // Option: sortTypesGroup: true and newlines-between-types: 'always-and-inside-groups' and consolidateIslands: 'never' (default)
          test({
            code: `
              import c from 'Bar';
              import d from 'bar';

              import {
                aa,
                bb,
                cc,
                dd,
                ee,
                ff,
                gg
              } from 'baz';

              import {
                hh,
                ii,
                jj,
                kk,
                ll,
                mm,
                nn
              } from 'fizz';

              import a from 'foo';

              import b from 'dirA/bar';

              import index from './';

              import type { AA,
                BB, CC } from 'abc';

              import type { Z } from 'fizz';

              import type {
                A,
                B
              } from 'foo';

              import type { C2 } from 'dirB/Bar';

              import type {
                D2,
                X2,
                Y2
              } from 'dirB/bar';

              import type { E2 } from 'dirB/baz';

              import type { C3 } from 'dirC/Bar';

              import type {
                D3,
                X3,
                Y3
              } from 'dirC/bar';

              import type { E3 } from 'dirC/baz';
              import type { F3 } from 'dirC/caz';

              import type { C1 } from 'dirA/Bar';

              import type {
                D1,
                X1,
                Y1
              } from 'dirA/bar';

              import type { E1 } from 'dirA/baz';

              import type { F } from './index.js';

              import type { G } from './aaa.js';
              import type { H } from './bbb';
            `,
            ...parserConfig,
            options: [
              {
                alphabetize: { order: 'asc' },
                groups: ['external', 'internal', 'index', 'type'],
                pathGroups: [
                  {
                    pattern: 'dirA/**',
                    group: 'internal',
                    position: 'after',
                  },
                  {
                    pattern: 'dirB/**',
                    group: 'internal',
                    position: 'before',
                  },
                  {
                    pattern: 'dirC/**',
                    group: 'internal',
                  },
                ],
                'newlines-between': 'always-and-inside-groups',
                'newlines-between-types': 'always-and-inside-groups',
                pathGroupsExcludedImportTypes: [],
                sortTypesGroup: true,
                consolidateIslands: 'never',
              },
            ],
          }),
          // Ensure consolidateIslands: 'inside-groups', newlines-between: 'always-and-inside-groups', and newlines-between-types: 'never' do not fight for dominance
          test({
            code: `
              import makeVanillaYargs from 'yargs/yargs';

              import { createDebugLogger } from 'multiverse+rejoinder';

              import { globalDebuggerNamespace } from 'rootverse+bfe:src/constant.ts';
              import { ErrorMessage, type KeyValueEntry } from 'rootverse+bfe:src/error.ts';

              import {
                $artificiallyInvoked,
                $canonical,
                $exists,
                $genesis
              } from 'rootverse+bfe:src/symbols.ts';

              import type {
                Entries,
                LiteralUnion,
                OmitIndexSignature,
                Promisable,
                StringKeyOf
              } from 'type-fest';
            `,
            ...parserConfig,
            options: [
              {
                alphabetize: {
                  order: 'asc',
                  orderImportKind: 'asc',
                  caseInsensitive: true,
                },
                named: {
                  enabled: true,
                  types: 'types-last',
                },
                groups: [
                  'builtin',
                  'external',
                  'internal',
                  ['parent', 'sibling', 'index'],
                  ['object', 'type'],
                ],
                pathGroups: [
                  {
                    pattern: 'multiverse{*,*/**}',
                    group: 'external',
                    position: 'after',
                  },
                  {
                    pattern: 'rootverse{*,*/**}',
                    group: 'external',
                    position: 'after',
                  },
                  {
                    pattern: 'universe{*,*/**}',
                    group: 'external',
                    position: 'after',
                  },
                ],
                distinctGroup: true,
                pathGroupsExcludedImportTypes: ['builtin', 'object'],
                'newlines-between': 'always-and-inside-groups',
                'newlines-between-types': 'never',
                sortTypesGroup: true,
                consolidateIslands: 'inside-groups',
              },
            ],
          }),
          // Ensure consolidateIslands: 'inside-groups', newlines-between: 'never', and newlines-between-types: 'always-and-inside-groups' do not fight for dominance
          test({
            code: `
              import makeVanillaYargs from 'yargs/yargs';
              import { createDebugLogger } from 'multiverse+rejoinder';
              import { globalDebuggerNamespace } from 'rootverse+bfe:src/constant.ts';
              import { ErrorMessage, type KeyValueEntry } from 'rootverse+bfe:src/error.ts';
              import { $artificiallyInvoked } from 'rootverse+bfe:src/symbols.ts';

              import type {
                Entries,
                LiteralUnion,
                OmitIndexSignature,
                Promisable,
                StringKeyOf
              } from 'type-fest';
            `,
            ...parserConfig,
            options: [
              {
                alphabetize: {
                  order: 'asc',
                  orderImportKind: 'asc',
                  caseInsensitive: true,
                },
                named: {
                  enabled: true,
                  types: 'types-last',
                },
                groups: [
                  'builtin',
                  'external',
                  'internal',
                  ['parent', 'sibling', 'index'],
                  ['object', 'type'],
                ],
                pathGroups: [
                  {
                    pattern: 'multiverse{*,*/**}',
                    group: 'external',
                    position: 'after',
                  },
                  {
                    pattern: 'rootverse{*,*/**}',
                    group: 'external',
                    position: 'after',
                  },
                  {
                    pattern: 'universe{*,*/**}',
                    group: 'external',
                    position: 'after',
                  },
                ],
                distinctGroup: true,
                pathGroupsExcludedImportTypes: ['builtin', 'object'],
                'newlines-between': 'never',
                'newlines-between-types': 'always-and-inside-groups',
                sortTypesGroup: true,
                consolidateIslands: 'inside-groups',
              },
            ],
          }),
          test({
            code: `
              import c from 'Bar';
              import d from 'bar';

              import {
                aa,
                bb,
                cc,
                dd,
                ee,
                ff,
                gg
              } from 'baz';

              import {
                hh,
                ii,
                jj,
                kk,
                ll,
                mm,
                nn
              } from 'fizz';

              import a from 'foo';
              import b from 'dirA/bar';
              import index from './';

              import type { AA,
                BB, CC } from 'abc';

              import type { Z } from 'fizz';

              import type {
                A,
                B
              } from 'foo';

              import type { C2 } from 'dirB/Bar';

              import type {
                D2,
                X2,
                Y2
              } from 'dirB/bar';

              import type { E2 } from 'dirB/baz';

              import type { C3 } from 'dirC/Bar';

              import type {
                D3,
                X3,
                Y3
              } from 'dirC/bar';

              import type { E3 } from 'dirC/baz';
              import type { F3 } from 'dirC/caz';

              import type { C1 } from 'dirA/Bar';

              import type {
                D1,
                X1,
                Y1
              } from 'dirA/bar';

              import type { E1 } from 'dirA/baz';

              import type { F } from './index.js';

              import type { G } from './aaa.js';
              import type { H } from './bbb';
            `,
            ...parserConfig,
            options: [
              {
                alphabetize: { order: 'asc' },
                groups: ['external', 'internal', 'index', 'type'],
                pathGroups: [
                  {
                    pattern: 'dirA/**',
                    group: 'internal',
                    position: 'after',
                  },
                  {
                    pattern: 'dirB/**',
                    group: 'internal',
                    position: 'before',
                  },
                  {
                    pattern: 'dirC/**',
                    group: 'internal',
                  },
                ],
                'newlines-between': 'never',
                'newlines-between-types': 'always-and-inside-groups',
                pathGroupsExcludedImportTypes: [],
                sortTypesGroup: true,
                consolidateIslands: 'inside-groups',
              },
            ],
          }),
          test({
            code: `
              import assert from 'assert';
              import { isNativeError } from 'util/types';

              import { runNoRejectOnBadExit } from '@-xun/run';
              import { TrialError } from 'named-app-errors';
              import { resolve as resolverLibrary } from 'resolve.exports';

              import { ${supportsImportTypeSpecifiers ? 'toAbsolutePath, type AbsolutePath' : 'AbsolutePath, toAbsolutePath'} } from 'rootverse+project-utils:src/fs.ts';

              import type { PackageJson } from 'type-fest';
              // Some comment about remembering to do something
              import type { XPackageJson } from 'rootverse:src/assets/config/_package.json.ts';
            `,
            ...parserConfig,
            options: [
              {
                alphabetize: {
                  order: 'asc',
                  orderImportKind: 'asc',
                  caseInsensitive: true,
                },
                named: {
                  enabled: true,
                  types: 'types-last',
                },
                groups: [
                  'builtin',
                  'external',
                  'internal',
                  ['parent', 'sibling', 'index'],
                  ['object', 'type'],
                ],
                pathGroups: [
                  {
                    pattern: 'rootverse{*,*/**}',
                    group: 'external',
                    position: 'after',
                  },
                ],
                distinctGroup: true,
                pathGroupsExcludedImportTypes: ['builtin', 'object'],
                'newlines-between': 'always-and-inside-groups',
                'newlines-between-types': 'never',
                sortTypesGroup: true,
                consolidateIslands: 'inside-groups',
              },
            ],
          }),

          // Documentation passing example #1 for newlines-between
          test({
            code: `
              import fs from 'fs';
              import path from 'path';

              import sibling from './foo';

              import index from './';
            `,
            ...parserConfig,
            options: [
              {
                'newlines-between': 'always',
              },
            ],
          }),
          // Documentation passing example #2 for newlines-between
          test({
            code: `
              import fs from 'fs';

              import path from 'path';

              import sibling from './foo';

              import index from './';
            `,
            ...parserConfig,
            options: [
              {
                'newlines-between': 'always-and-inside-groups',
              },
            ],
          }),
          // Documentation passing example #3 for newlines-between
          test({
            code: `
              import fs from 'fs';
              import path from 'path';
              import sibling from './foo';
              import index from './';
            `,
            ...parserConfig,
            options: [
              {
                'newlines-between': 'never',
              },
            ],
          }),
          // Documentation passing example #1 for alphabetize
          test({
            code: `
              import blist2 from 'blist';
              import blist from 'BList';
              import * as classnames from 'classnames';
              import aTypes from 'prop-types';
              import React, { PureComponent } from 'react';
              import { compose, apply } from 'xcompose';
            `,
            ...parserConfig,
            options: [
              {
                alphabetize: {
                  order: 'asc',
                  caseInsensitive: true,
                },
              },
            ],
          }),
          // (not an example, but we also test caseInsensitive: false for completeness)
          test({
            code: `
              import blist from 'BList';
              import blist2 from 'blist';
              import * as classnames from 'classnames';
              import aTypes from 'prop-types';
              import React, { PureComponent } from 'react';
              import { compose, apply } from 'xcompose';
            `,
            ...parserConfig,
            options: [
              {
                alphabetize: {
                  order: 'asc',
                  caseInsensitive: false,
                },
              },
            ],
          }),
          // Documentation passing example #1 for named
          test({
            code: `
              import { apply, compose } from 'xcompose';
            `,
            ...parserConfig,
            options: [
              {
                named: true,
                alphabetize: {
                  order: 'asc',
                },
              },
            ],
          }),
          // Documentation passing example #1 for warnOnUnassignedImports
          test({
            code: `
              import fs from 'fs';
              import path from 'path';
              import './styles.css';
            `,
            ...parserConfig,
            options: [
              {
                warnOnUnassignedImports: true,
              },
            ],
          }),
          // Documentation passing example #1 for sortTypesGroup
          test({
            code: `
              import type A from "fs";
              import type B from "path";
              import type C from "../foo.js";
              import type D from "./bar.js";
              import type E from './';

              import a from "fs";
              import b from "path";
              import c from "../foo.js";
              import d from "./bar.js";
              import e from "./";
            `,
            ...parserConfig,
            options: [
              {
                groups: ['type', 'builtin', 'parent', 'sibling', 'index'],
                alphabetize: { order: 'asc' },
                sortTypesGroup: true,
              },
            ],
          }),
          // (not an example, but we also test the reverse for completeness)
          test({
            code: `
              import a from "fs";
              import b from "path";
              import c from "../foo.js";
              import d from "./bar.js";
              import e from "./";

              import type A from "fs";
              import type B from "path";
              import type C from "../foo.js";
              import type D from "./bar.js";
              import type E from './';
            `,
            ...parserConfig,
            options: [
              {
                groups: ['builtin', 'parent', 'sibling', 'index', 'type'],
                sortTypesGroup: true,
              },
            ],
          }),
          // Documentation passing example #1 for newlines-between-types
          test({
            code: `
              import type A from "fs";
              import type B from "path";
              import type C from "../foo.js";
              import type D from "./bar.js";
              import type E from './';

              import a from "fs";
              import b from "path";

              import c from "../foo.js";

              import d from "./bar.js";

              import e from "./";
            `,
            ...parserConfig,
            options: [
              {
                groups: ['type', 'builtin', 'parent', 'sibling', 'index'],
                sortTypesGroup: true,
                'newlines-between': 'always',
                'newlines-between-types': 'ignore',
              },
            ],
          }),
          // (not an example, but we also test the reverse for completeness)
          test({
            code: `
              import a from "fs";
              import b from "path";

              import c from "../foo.js";

              import d from "./bar.js";

              import e from "./";

              import type A from "fs";
              import type B from "path";
              import type C from "../foo.js";
              import type D from "./bar.js";
              import type E from './';
            `,
            ...parserConfig,
            options: [
              {
                groups: ['builtin', 'parent', 'sibling', 'index', 'type'],
                sortTypesGroup: true,
                'newlines-between': 'always',
                'newlines-between-types': 'ignore',
              },
            ],
          }),
          // Documentation passing example #2 for newlines-between-types
          test({
            code: `
              import type A from "fs";
              import type B from "path";

              import type C from "../foo.js";

              import type D from "./bar.js";

              import type E from './';

              import a from "fs";
              import b from "path";
              import c from "../foo.js";
              import d from "./bar.js";
              import e from "./";
            `,
            ...parserConfig,
            options: [
              {
                groups: ['type', 'builtin', 'parent', 'sibling', 'index'],
                sortTypesGroup: true,
                'newlines-between': 'never',
                'newlines-between-types': 'always',
              },
            ],
          }),
          // (not an example, but we also test the reverse for completeness)
          test({
            code: `
              import a from "fs";
              import b from "path";
              import c from "../foo.js";
              import d from "./bar.js";
              import e from "./";

              import type A from "fs";
              import type B from "path";

              import type C from "../foo.js";

              import type D from "./bar.js";

              import type E from './';
            `,
            ...parserConfig,
            options: [
              {
                groups: ['builtin', 'parent', 'sibling', 'index', 'type'],
                sortTypesGroup: true,
                'newlines-between': 'never',
                'newlines-between-types': 'always',
              },
            ],
          }),
          // Documentation passing example #1 for consolidateIslands
          test({
            code: `
              var fs = require('fs');
              var path = require('path');
              var { util1, util2, util3 } = require('util');

              var async = require('async');

              var relParent1 = require('../foo');

              var {
                relParent21,
                relParent22,
                relParent23,
                relParent24,
              } = require('../');

              var relParent3 = require('../bar');

              var { sibling1,
                sibling2, sibling3 } = require('./foo');

              var sibling2 = require('./bar');
              var sibling3 = require('./foobar');
            `,
            ...parserConfig,
            options: [
              {
                'newlines-between': 'always-and-inside-groups',
                consolidateIslands: 'inside-groups',
              },
            ],
          }),
          // Documentation passing example #2 for consolidateIslands
          test({
            code: `
              import c from 'Bar';
              import d from 'bar';

              import {
                aa,
                bb,
                cc,
                dd,
                ee,
                ff,
                gg
              } from 'baz';

              import {
                hh,
                ii,
                jj,
                kk,
                ll,
                mm,
                nn
              } from 'fizz';

              import a from 'foo';

              import b from 'dirA/bar';

              import index from './';

              import type { AA,
                BB, CC } from 'abc';

              import type { Z } from 'fizz';

              import type {
                A,
                B
              } from 'foo';

              import type { C2 } from 'dirB/Bar';

              import type {
                D2,
                X2,
                Y2
              } from 'dirB/bar';

              import type { E2 } from 'dirB/baz';
              import type { C3 } from 'dirC/Bar';

              import type {
                D3,
                X3,
                Y3
              } from 'dirC/bar';

              import type { E3 } from 'dirC/baz';
              import type { F3 } from 'dirC/caz';
              import type { C1 } from 'dirA/Bar';

              import type {
                D1,
                X1,
                Y1
              } from 'dirA/bar';

              import type { E1 } from 'dirA/baz';
              import type { F } from './index.js';
              import type { G } from './aaa.js';
              import type { H } from './bbb';
            `,
            ...parserConfig,
            options: [
              {
                alphabetize: { order: 'asc' },
                groups: ['external', 'internal', 'index', 'type'],
                pathGroups: [
                  {
                    pattern: 'dirA/**',
                    group: 'internal',
                    position: 'after',
                  },
                  {
                    pattern: 'dirB/**',
                    group: 'internal',
                    position: 'before',
                  },
                  {
                    pattern: 'dirC/**',
                    group: 'internal',
                  },
                ],
                'newlines-between': 'always-and-inside-groups',
                'newlines-between-types': 'never',
                pathGroupsExcludedImportTypes: [],
                sortTypesGroup: true,
                consolidateIslands: 'inside-groups',
              },
            ],
          }),
          // (not an example, but we also test the reverse for completeness)
          test({
            code: `
              import type { AA,
                BB, CC } from 'abc';

              import type { Z } from 'fizz';

              import type {
                A,
                B
              } from 'foo';

              import type { C2 } from 'dirB/Bar';

              import type {
                D2,
                X2,
                Y2
              } from 'dirB/bar';

              import type { E2 } from 'dirB/baz';
              import type { C3 } from 'dirC/Bar';

              import type {
                D3,
                X3,
                Y3
              } from 'dirC/bar';

              import type { E3 } from 'dirC/baz';
              import type { F3 } from 'dirC/caz';
              import type { C1 } from 'dirA/Bar';

              import type {
                D1,
                X1,
                Y1
              } from 'dirA/bar';

              import type { E1 } from 'dirA/baz';
              import type { F } from './index.js';
              import type { G } from './aaa.js';
              import type { H } from './bbb';

              import c from 'Bar';
              import d from 'bar';

              import {
                aa,
                bb,
                cc,
                dd,
                ee,
                ff,
                gg
              } from 'baz';

              import {
                hh,
                ii,
                jj,
                kk,
                ll,
                mm,
                nn
              } from 'fizz';

              import a from 'foo';

              import b from 'dirA/bar';

              import index from './';
            `,
            ...parserConfig,
            options: [
              {
                alphabetize: { order: 'asc' },
                groups: ['type', 'external', 'internal', 'index'],
                pathGroups: [
                  {
                    pattern: 'dirA/**',
                    group: 'internal',
                    position: 'after',
                  },
                  {
                    pattern: 'dirB/**',
                    group: 'internal',
                    position: 'before',
                  },
                  {
                    pattern: 'dirC/**',
                    group: 'internal',
                  },
                ],
                'newlines-between': 'always-and-inside-groups',
                'newlines-between-types': 'never',
                pathGroupsExcludedImportTypes: [],
                sortTypesGroup: true,
                consolidateIslands: 'inside-groups',
              },
            ],
          }),
        ),
        invalid: [].concat(
          // Option alphabetize: {order: 'asc'}
          test({
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
            ...parserConfig,
            options: [
              {
                groups: ['external', 'index'],
                alphabetize: { order: 'asc' },
              },
            ],
            errors: [
              {
                message: semver.satisfies(eslintPkg.version, '< 3')
                  ? '`bar` import should occur after type import of `Bar`'
                  : /(`bar` import should occur after type import of `Bar`)|(`Bar` type import should occur before import of `bar`)/,
              },
            ],
          }),
          // Option alphabetize: {order: 'desc'}
          test({
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
            ...parserConfig,
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
          }),
          // Option alphabetize: {order: 'asc'} with type group
          test({
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
            ...parserConfig,
            options: [
              {
                groups: ['external', 'index', 'type'],
                alphabetize: { order: 'asc' },
              },
            ],
            errors: semver.satisfies(eslintPkg.version, '< 3') ? [
              { message: '`Bar` import should occur before import of `bar`' },
              { message: '`Bar` type import should occur before type import of `foo`' },
            ] : [
              { message: /(`Bar` import should occur before import of `bar`)|(`bar` import should occur after import of `Bar`)/ },
              { message: /(`Bar` type import should occur before type import of `foo`)|(`foo` type import should occur after type import of `Bar`)/ },
            ],
          }),
          // Option alphabetize: {order: 'desc'} with type group
          test({
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
            ...parserConfig,
            options: [
              {
                groups: ['external', 'index', 'type'],
                alphabetize: { order: 'desc' },
              },
            ],
            errors: semver.satisfies(eslintPkg.version, '< 3') ? [
              { message: '`bar` import should occur before import of `Bar`' },
              { message: '`foo` type import should occur before type import of `Bar`' },
            ] : [
              { message: /(`bar` import should occur before import of `Bar`)|(`Bar` import should occur after import of `bar`)/ },
              { message: /(`foo` type import should occur before type import of `Bar`)|(`Bar` type import should occur after import of type `foo`)/ },
            ],
          }),
          // warns for out of order unassigned imports (warnOnUnassignedImports enabled)
          test(withoutAutofixOutput({
            code: `
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
          })),
          // fix cannot move below unassigned import (warnOnUnassignedImports enabled)
          test(withoutAutofixOutput({
            code: `
              import local from './local';

              import 'global1';

              import global2 from 'global2';
              import global3 from 'global3';
            `,
            errors: [{
              message: '`./local` import should occur after import of `global3`',
            }],
            options: [{ warnOnUnassignedImports: true }],
          })),
          // Imports inside module declaration
          test({
            code: `
              import type { ParsedPath } from 'path';
              import type { CopyOptions } from 'fs';

              declare module 'my-module' {
                import type { ParsedPath } from 'path';
                import type { CopyOptions } from 'fs';
              }
            `,
            output: `
              import type { CopyOptions } from 'fs';
              import type { ParsedPath } from 'path';

              declare module 'my-module' {
                import type { CopyOptions } from 'fs';
                import type { ParsedPath } from 'path';
              }
            `,
            errors: [
              { message: '`fs` type import should occur before type import of `path`' },
              { message: '`fs` type import should occur before type import of `path`' },
            ],
            ...parserConfig,
            options: [
              {
                alphabetize: { order: 'asc' },
              },
            ],
          }),
          // named import order
          test({
            code: `
              import { type Z, A } from "./Z";
              import type N, { E, D } from "./Z";
              import type { L, G } from "./Z";
            `,
            output: `
              import { A, type Z } from "./Z";
              import type N, { D, E } from "./Z";
              import type { G, L } from "./Z";
            `,
            ...parserConfig,
            options: [{
              named: true,
              alphabetize: { order: 'asc' },
            }],
            errors: [
              { message: `\`A\` import should occur before${supportsImportTypeSpecifiers ? ' type' : ''} import of \`Z\`` },
              { message: '`D` import should occur before import of `E`' },
              { message: '`G` import should occur before import of `L`' },
            ],
          }),
          test({
            code: `
              const { B, /* Hello World */ A } = require("./Z");
              export { B, A } from "./Z";
            `,
            output: `
              const { /* Hello World */ A, B } = require("./Z");
              export { A, B } from "./Z";
            `,
            ...parserConfig,
            options: [{
              named: true,
              alphabetize: { order: 'asc' },
            }],
            errors: [{
              message: '`A` import should occur before import of `B`',
            }, {
              message: '`A` export should occur before export of `B`',
            }],
          }),
          // Options: sortTypesGroup + newlines-between-types example #1 from the documentation (fail)
          test({
            code: `
              import type A from "fs";
              import type B from "path";
              import type C from "../foo.js";
              import type D from "./bar.js";
              import type E from './';

              import a from "fs";
              import b from "path";

              import c from "../foo.js";

              import d from "./bar.js";

              import e from "./";
            `,
            output: `
              import type A from "fs";
              import type B from "path";

              import type C from "../foo.js";

              import type D from "./bar.js";

              import type E from './';

              import a from "fs";
              import b from "path";

              import c from "../foo.js";

              import d from "./bar.js";

              import e from "./";
            `,
            ...parserConfig,
            options: [
              {
                groups: ['type', 'builtin', 'parent', 'sibling', 'index'],
                sortTypesGroup: true,
                'newlines-between': 'always',
              },
            ],
            errors: [
              {
                message: 'There should be at least one empty line between import groups',
                line: 3,
              },
              {
                message: 'There should be at least one empty line between import groups',
                line: 4,
              },
              {
                message: 'There should be at least one empty line between import groups',
                line: 5,
              },
            ],
          }),
          // Options: sortTypesGroup + newlines-between-types example #2 from the documentation (fail)
          test({
            code: `
              import type A from "fs";
              import type B from "path";
              import type C from "../foo.js";
              import type D from "./bar.js";
              import type E from './';

              import a from "fs";
              import b from "path";

              import c from "../foo.js";

              import d from "./bar.js";

              import e from "./";
            `,
            output: `
              import type A from "fs";
              import type B from "path";
              import type C from "../foo.js";
              import type D from "./bar.js";
              import type E from './';
              import a from "fs";
              import b from "path";

              import c from "../foo.js";

              import d from "./bar.js";

              import e from "./";
            `,
            ...parserConfig,
            options: [
              {
                groups: ['type', 'builtin', 'parent', 'sibling', 'index'],
                sortTypesGroup: true,
                'newlines-between': 'always',
                'newlines-between-types': 'never',
              },
            ],
            errors: [
              {
                message: 'There should be no empty line between import groups',
                line: 6,
              },
            ],
          }),
          // Option: sortTypesGroup: true and newlines-between-types: 'always-and-inside-groups' and consolidateIslands: 'inside-groups' with all newlines
          test({
            code: `
              import c from 'Bar';

              import d from 'bar';

              import {
                aa,
                bb,
                cc,
                dd,
                ee,
                ff,
                gg
              } from 'baz';

              import {
                hh,
                ii,
                jj,
                kk,
                ll,
                mm,
                nn
              } from 'fizz';

              import a from 'foo';

              import b from 'dirA/bar';

              import index from './';

              import type { AA,
                BB, CC } from 'abc';

              import type { Z } from 'fizz';

              import type {
                A,
                B
              } from 'foo';

              import type { C2 } from 'dirB/Bar';

              import type {
                D2,
                X2,
                Y2
              } from 'dirB/bar';

              import type { E2 } from 'dirB/baz';

              import type { C3 } from 'dirC/Bar';

              import type {
                D3,
                X3,
                Y3
              } from 'dirC/bar';

              import type { E3 } from 'dirC/baz';

              import type { F3 } from 'dirC/caz';

              import type { C1 } from 'dirA/Bar';

              import type {
                D1,
                X1,
                Y1
              } from 'dirA/bar';

              import type { E1 } from 'dirA/baz';

              import type { F } from './index.js';

              import type { G } from './aaa.js';

              import type { H } from './bbb';
            `,
            output: `
              import c from 'Bar';
              import d from 'bar';

              import {
                aa,
                bb,
                cc,
                dd,
                ee,
                ff,
                gg
              } from 'baz';

              import {
                hh,
                ii,
                jj,
                kk,
                ll,
                mm,
                nn
              } from 'fizz';

              import a from 'foo';

              import b from 'dirA/bar';

              import index from './';

              import type { AA,
                BB, CC } from 'abc';

              import type { Z } from 'fizz';

              import type {
                A,
                B
              } from 'foo';

              import type { C2 } from 'dirB/Bar';

              import type {
                D2,
                X2,
                Y2
              } from 'dirB/bar';

              import type { E2 } from 'dirB/baz';

              import type { C3 } from 'dirC/Bar';

              import type {
                D3,
                X3,
                Y3
              } from 'dirC/bar';

              import type { E3 } from 'dirC/baz';
              import type { F3 } from 'dirC/caz';

              import type { C1 } from 'dirA/Bar';

              import type {
                D1,
                X1,
                Y1
              } from 'dirA/bar';

              import type { E1 } from 'dirA/baz';

              import type { F } from './index.js';

              import type { G } from './aaa.js';
              import type { H } from './bbb';
            `,
            ...parserConfig,
            options: [
              {
                alphabetize: { order: 'asc' },
                groups: ['external', 'internal', 'index', 'type'],
                pathGroups: [
                  {
                    pattern: 'dirA/**',
                    group: 'internal',
                    position: 'after',
                  },
                  {
                    pattern: 'dirB/**',
                    group: 'internal',
                    position: 'before',
                  },
                  {
                    pattern: 'dirC/**',
                    group: 'internal',
                  },
                ],
                'newlines-between': 'always-and-inside-groups',
                'newlines-between-types': 'always-and-inside-groups',
                pathGroupsExcludedImportTypes: [],
                sortTypesGroup: true,
                consolidateIslands: 'inside-groups',
              },
            ],
            errors: [
              {
                message:
                  'There should be no empty lines between this single-line import and the single-line import that follows it',
                line: 2,
              },
              {
                message:
                  'There should be no empty lines between this single-line import and the single-line import that follows it',
                line: 60,
              },
              {
                message:
                  'There should be no empty lines between this single-line import and the single-line import that follows it',
                line: 76,
              },
            ],
          }),
          // Option: sortTypesGroup: true and newlines-between-types: 'always-and-inside-groups' and consolidateIslands: 'inside-groups' with no newlines
          test({
            code: `
              import c from 'Bar';
              import d from 'bar';
              import {
                aa,
                bb,
                cc,
                dd,
                ee,
                ff,
                gg
              } from 'baz';
              import {
                hh,
                ii,
                jj,
                kk,
                ll,
                mm,
                nn
              } from 'fizz';
              import a from 'foo';
              import b from 'dirA/bar';
              import index from './';
              import type { AA,
                BB, CC } from 'abc';
              import type { Z } from 'fizz';
              import type {
                A,
                B
              } from 'foo';
              import type { C2 } from 'dirB/Bar';
              import type {
                D2,
                X2,
                Y2
              } from 'dirB/bar';
              import type { E2 } from 'dirB/baz';
              import type { C3 } from 'dirC/Bar';
              import type {
                D3,
                X3,
                Y3
              } from 'dirC/bar';
              import type { E3 } from 'dirC/baz';
              import type { F3 } from 'dirC/caz';
              import type { C1 } from 'dirA/Bar';
              import type {
                D1,
                X1,
                Y1
              } from 'dirA/bar';
              import type { E1 } from 'dirA/baz';
              import type { F } from './index.js';
              import type { G } from './aaa.js';
              import type { H } from './bbb';
            `,
            output: `
              import c from 'Bar';
              import d from 'bar';

              import {
                aa,
                bb,
                cc,
                dd,
                ee,
                ff,
                gg
              } from 'baz';

              import {
                hh,
                ii,
                jj,
                kk,
                ll,
                mm,
                nn
              } from 'fizz';

              import a from 'foo';

              import b from 'dirA/bar';

              import index from './';

              import type { AA,
                BB, CC } from 'abc';

              import type { Z } from 'fizz';

              import type {
                A,
                B
              } from 'foo';

              import type { C2 } from 'dirB/Bar';

              import type {
                D2,
                X2,
                Y2
              } from 'dirB/bar';

              import type { E2 } from 'dirB/baz';

              import type { C3 } from 'dirC/Bar';

              import type {
                D3,
                X3,
                Y3
              } from 'dirC/bar';

              import type { E3 } from 'dirC/baz';
              import type { F3 } from 'dirC/caz';

              import type { C1 } from 'dirA/Bar';

              import type {
                D1,
                X1,
                Y1
              } from 'dirA/bar';

              import type { E1 } from 'dirA/baz';

              import type { F } from './index.js';

              import type { G } from './aaa.js';
              import type { H } from './bbb';
            `,
            ...parserConfig,
            options: [
              {
                alphabetize: { order: 'asc' },
                groups: ['external', 'internal', 'index', 'type'],
                pathGroups: [
                  {
                    pattern: 'dirA/**',
                    group: 'internal',
                    position: 'after',
                  },
                  {
                    pattern: 'dirB/**',
                    group: 'internal',
                    position: 'before',
                  },
                  {
                    pattern: 'dirC/**',
                    group: 'internal',
                  },
                ],
                'newlines-between': 'always-and-inside-groups',
                'newlines-between-types': 'always-and-inside-groups',
                pathGroupsExcludedImportTypes: [],
                sortTypesGroup: true,
                consolidateIslands: 'inside-groups',
              },
            ],
            errors: [
              {
                message: 'There should be at least one empty line between this import and the multi-line import that follows it',
                line: 3,
              },
              {
                message: 'There should be at least one empty line between this import and the multi-line import that follows it',
                line: 4,
              },
              {
                message: 'There should be at least one empty line between this multi-line import and the import that follows it',
                line: 13,
              },
              {
                message: 'There should be at least one empty line between import groups',
                line: 22,
              },
              {
                message: 'There should be at least one empty line between import groups',
                line: 23,
              },
              {
                message: 'There should be at least one empty line between import groups',
                line: 24,
              },
              {
                message: 'There should be at least one empty line between this multi-line import and the import that follows it',
                line: 25,
              },
              {
                message: 'There should be at least one empty line between this import and the multi-line import that follows it',
                line: 27,
              },
              {
                message: 'There should be at least one empty line between import groups',
                line: 28,
              },
              {
                message: 'There should be at least one empty line between this import and the multi-line import that follows it',
                line: 32,
              },
              {
                message: 'There should be at least one empty line between this multi-line import and the import that follows it',
                line: 33,
              },
              {
                message: 'There should be at least one empty line between import groups',
                line: 38,
              },
              {
                message: 'There should be at least one empty line between this import and the multi-line import that follows it',
                line: 39,
              },
              {
                message: 'There should be at least one empty line between this multi-line import and the import that follows it',
                line: 40,
              },
              {
                message: 'There should be at least one empty line between import groups',
                line: 46,
              },
              {
                message: 'There should be at least one empty line between this import and the multi-line import that follows it',
                line: 47,
              },
              {
                message: 'There should be at least one empty line between this multi-line import and the import that follows it',
                line: 48,
              },
              {
                message: 'There should be at least one empty line between import groups',
                line: 53,
              },
              {
                message: 'There should be at least one empty line between import groups',
                line: 54,
              },
            ],
          }),
          // Option: sortTypesGroup: true and newlines-between-types: 'always-and-inside-groups' and consolidateIslands: 'never' (default)
          test({
            code: `
              import c from 'Bar';
              import d from 'bar';
              import {
                aa,
                bb,
                cc,
                dd,
                ee,
                ff,
                gg
              } from 'baz';
              import {
                hh,
                ii,
                jj,
                kk,
                ll,
                mm,
                nn
              } from 'fizz';
              import a from 'foo';
              import b from 'dirA/bar';
              import index from './';
              import type { AA,
                BB, CC } from 'abc';
              import type { Z } from 'fizz';
              import type {
                A,
                B
              } from 'foo';
              import type { C2 } from 'dirB/Bar';
              import type {
                D2,
                X2,
                Y2
              } from 'dirB/bar';
              import type { E2 } from 'dirB/baz';
              import type { C3 } from 'dirC/Bar';
              import type {
                D3,
                X3,
                Y3
              } from 'dirC/bar';
              import type { E3 } from 'dirC/baz';
              import type { F3 } from 'dirC/caz';
              import type { C1 } from 'dirA/Bar';
              import type {
                D1,
                X1,
                Y1
              } from 'dirA/bar';
              import type { E1 } from 'dirA/baz';
              import type { F } from './index.js';
              import type { G } from './aaa.js';
              import type { H } from './bbb';
            `,
            output: `
              import c from 'Bar';
              import d from 'bar';
              import {
                aa,
                bb,
                cc,
                dd,
                ee,
                ff,
                gg
              } from 'baz';
              import {
                hh,
                ii,
                jj,
                kk,
                ll,
                mm,
                nn
              } from 'fizz';
              import a from 'foo';

              import b from 'dirA/bar';

              import index from './';

              import type { AA,
                BB, CC } from 'abc';
              import type { Z } from 'fizz';
              import type {
                A,
                B
              } from 'foo';

              import type { C2 } from 'dirB/Bar';
              import type {
                D2,
                X2,
                Y2
              } from 'dirB/bar';
              import type { E2 } from 'dirB/baz';

              import type { C3 } from 'dirC/Bar';
              import type {
                D3,
                X3,
                Y3
              } from 'dirC/bar';
              import type { E3 } from 'dirC/baz';
              import type { F3 } from 'dirC/caz';

              import type { C1 } from 'dirA/Bar';
              import type {
                D1,
                X1,
                Y1
              } from 'dirA/bar';
              import type { E1 } from 'dirA/baz';

              import type { F } from './index.js';

              import type { G } from './aaa.js';
              import type { H } from './bbb';
            `,
            ...parserConfig,
            options: [
              {
                alphabetize: { order: 'asc' },
                groups: ['external', 'internal', 'index', 'type'],
                pathGroups: [
                  {
                    pattern: 'dirA/**',
                    group: 'internal',
                    position: 'after',
                  },
                  {
                    pattern: 'dirB/**',
                    group: 'internal',
                    position: 'before',
                  },
                  {
                    pattern: 'dirC/**',
                    group: 'internal',
                  },
                ],
                'newlines-between': 'always-and-inside-groups',
                'newlines-between-types': 'always-and-inside-groups',
                pathGroupsExcludedImportTypes: [],
                sortTypesGroup: true,
                consolidateIslands: 'never',
              },
            ],
            errors: [
              {
                message: 'There should be at least one empty line between import groups',
                line: 22,
              },
              {
                message: 'There should be at least one empty line between import groups',
                line: 23,
              },
              {
                message: 'There should be at least one empty line between import groups',
                line: 24,
              },
              {
                message: 'There should be at least one empty line between import groups',
                line: 28,
              },
              {
                message: 'There should be at least one empty line between import groups',
                line: 38,
              },
              {
                message: 'There should be at least one empty line between import groups',
                line: 46,
              },
              {
                message: 'There should be at least one empty line between import groups',
                line: 53,
              },
              {
                message: 'There should be at least one empty line between import groups',
                line: 54,
              },

            ],
          }),

          // Documentation failing example #1 for newlines-between
          test({
            code: `
              import fs from 'fs';
              import path from 'path';
              import sibling from './foo';
              import index from './';
            `,
            output: `
              import fs from 'fs';
              import path from 'path';

              import sibling from './foo';

              import index from './';
            `,
            ...parserConfig,
            options: [
              {
                'newlines-between': 'always',
              },
            ],
            errors: [
              {
                message: 'There should be at least one empty line between import groups',
                line: 3,
              },
              {
                message: 'There should be at least one empty line between import groups',
                line: 4,
              },
            ],
          }),
          // Documentation failing example #2 for newlines-between
          test({
            code: `
              import fs from 'fs';

              import path from 'path';
              import sibling from './foo';
              import index from './';
            `,
            output: `
              import fs from 'fs';

              import path from 'path';

              import sibling from './foo';

              import index from './';
            `,
            ...parserConfig,
            options: [
              {
                'newlines-between': 'always-and-inside-groups',
              },
            ],
            errors: [
              {
                message: 'There should be at least one empty line between import groups',
                line: 4,
              },
              {
                message: 'There should be at least one empty line between import groups',
                line: 5,
              },
            ],
          }),
          // Documentation failing example #3 for newlines-between
          test({
            code: `
              import fs from 'fs';
              import path from 'path';

              import sibling from './foo';

              import index from './';
            `,
            output: `
              import fs from 'fs';
              import path from 'path';
              import sibling from './foo';
              import index from './';
            `,
            ...parserConfig,
            options: [
              {
                'newlines-between': 'never',
              },
            ],
            errors: [
              {
                message: 'There should be no empty line between import groups',
                line: 3,
              },
              {
                message: 'There should be no empty line between import groups',
                line: 5,
              },
            ],
          }),
          // Multiple errors
          ...semver.satisfies(eslintPkg.version, '< 3.0.0') ? [] : [
            // Documentation failing example #1 for alphabetize
            test({
              code: `
                import React, { PureComponent } from 'react';
                import aTypes from 'prop-types';
                import { compose, apply } from 'xcompose';
                import * as classnames from 'classnames';
                import blist2 from 'blist';
                import blist from 'BList';
              `,
              // The reason why this output does not match the success example after being fixed is because eslint will leave overlapping errors alone, so only one import gets reordered when fixes are applied
              output: `
                import aTypes from 'prop-types';
                import React, { PureComponent } from 'react';
                import { compose, apply } from 'xcompose';
                import * as classnames from 'classnames';
                import blist2 from 'blist';
                import blist from 'BList';
              `,
              ...parserConfig,
              options: [
                {
                  alphabetize: {
                    order: 'asc',
                    caseInsensitive: true,
                  },
                },
              ],
              errors: [
                {
                  message: '`prop-types` import should occur before import of `react`',
                  line: 3,
                },
                {
                  message: '`classnames` import should occur before import of `react`',
                  line: 5,
                },
                {
                  message: '`blist` import should occur before import of `react`',
                  line: 6,
                },
                {
                  message: '`BList` import should occur before import of `react`',
                  line: 7,
                },
              ],
            }),
          ],
          // Documentation failing example #1 for named
          test({
            code: `
              import { compose, apply } from 'xcompose';
            `,
            output: `
              import { apply, compose } from 'xcompose';
            `,
            ...parserConfig,
            options: [
              {
                named: true,
                alphabetize: {
                  order: 'asc',
                },
              },
            ],
            errors: [
              {
                message: '`apply` import should occur before import of `compose`',
                line: 2,
              },
            ],
          }),
          // Documentation failing example #1 for warnOnUnassignedImports
          test({
            code: `
              import fs from 'fs';
              import './styles.css';
              import path from 'path';
            `,
            // Should not be fixed (eslint@>=9 expects null)
            output: semver.satisfies(eslintPkg.version, '< 9.0.0') ? `
              import fs from 'fs';
              import './styles.css';
              import path from 'path';
            ` : null,
            ...parserConfig,
            options: [
              {
                warnOnUnassignedImports: true,
              },
            ],
            errors: [
              {
                message: '`path` import should occur before import of `./styles.css`',
                line: 4,
              },
            ],
          }),
          // Documentation failing example #1 for sortTypesGroup
          test({
            code: `
              import type A from "fs";
              import type B from "path";
              import type C from "../foo.js";
              import type D from "./bar.js";
              import type E from './';

              import a from "fs";
              import b from "path";
              import c from "../foo.js";
              import d from "./bar.js";
              import e from "./";
            `,
            // This is the "correct" behavior, but it's the wrong outcome (expectedly)
            output: semver.satisfies(eslintPkg.version, '< 3.0.0')
            // eslint@2 apparently attempts to fix multiple errors in one pass,
            // which results in different erroneous output
              ? `
              import type E from './';
              import type A from "fs";
              import type B from "path";
              import type C from "../foo.js";
              import type D from "./bar.js";

              import a from "fs";
              import b from "path";
              import c from "../foo.js";
              import d from "./bar.js";
              import e from "./";
            ` : `
              import type C from "../foo.js";
              import type A from "fs";
              import type B from "path";
              import type D from "./bar.js";
              import type E from './';

              import a from "fs";
              import b from "path";
              import c from "../foo.js";
              import d from "./bar.js";
              import e from "./";
            `,
            ...parserConfig,
            options: [
              {
                groups: ['type', 'builtin', 'parent', 'sibling', 'index'],
                alphabetize: { order: 'asc' },
              },
            ],
            errors: [
              {
                message: '`../foo.js` type import should occur before type import of `fs`',
                line: 4,
              },
              {
                message: '`./bar.js` type import should occur before type import of `fs`',
                line: 5,
              },
              {
                message: '`./` type import should occur before type import of `fs`',
                line: 6,
              },
            ],
          }),
          // Documentation failing example #1 for newlines-between-types
          test({
            code: `
              import type A from "fs";
              import type B from "path";
              import type C from "../foo.js";
              import type D from "./bar.js";
              import type E from './';

              import a from "fs";
              import b from "path";

              import c from "../foo.js";

              import d from "./bar.js";

              import e from "./";
            `,
            output: `
              import type A from "fs";
              import type B from "path";

              import type C from "../foo.js";

              import type D from "./bar.js";

              import type E from './';

              import a from "fs";
              import b from "path";

              import c from "../foo.js";

              import d from "./bar.js";

              import e from "./";
            `,
            ...parserConfig,
            options: [
              {
                groups: ['type', 'builtin', 'parent', 'sibling', 'index'],
                sortTypesGroup: true,
                'newlines-between': 'always',
              },
            ],
            errors: [
              {
                message: 'There should be at least one empty line between import groups',
                line: 3,
              },
              {
                message: 'There should be at least one empty line between import groups',
                line: 4,
              },
              {
                message: 'There should be at least one empty line between import groups',
                line: 5,
              },
            ],
          }),
          // Documentation failing example #2 for newlines-between-types
          test({
            code: `
              import type A from "fs";
              import type B from "path";
              import type C from "../foo.js";
              import type D from "./bar.js";
              import type E from './';

              import a from "fs";
              import b from "path";

              import c from "../foo.js";

              import d from "./bar.js";

              import e from "./";
            `,
            output: `
              import type A from "fs";
              import type B from "path";
              import type C from "../foo.js";
              import type D from "./bar.js";
              import type E from './';
              import a from "fs";
              import b from "path";

              import c from "../foo.js";

              import d from "./bar.js";

              import e from "./";
            `,
            ...parserConfig,
            options: [
              {
                groups: ['type', 'builtin', 'parent', 'sibling', 'index'],
                sortTypesGroup: true,
                'newlines-between': 'always',
                'newlines-between-types': 'never',
              },
            ],
            errors: [
              {
                message: 'There should be no empty line between import groups',
                line: 6,
              },
            ],
          }),
          // Documentation failing example #1 for consolidateIslands
          test({
            code: `
              var fs = require('fs');
              var path = require('path');
              var { util1, util2, util3 } = require('util');
              var async = require('async');
              var relParent1 = require('../foo');
              var {
                relParent21,
                relParent22,
                relParent23,
                relParent24,
              } = require('../');
              var relParent3 = require('../bar');
              var { sibling1,
                sibling2, sibling3 } = require('./foo');
              var sibling2 = require('./bar');
              var sibling3 = require('./foobar');
            `,
            output: `
              var fs = require('fs');
              var path = require('path');
              var { util1, util2, util3 } = require('util');

              var async = require('async');

              var relParent1 = require('../foo');

              var {
                relParent21,
                relParent22,
                relParent23,
                relParent24,
              } = require('../');

              var relParent3 = require('../bar');

              var { sibling1,
                sibling2, sibling3 } = require('./foo');

              var sibling2 = require('./bar');
              var sibling3 = require('./foobar');
            `,
            ...parserConfig,
            options: [
              {
                'newlines-between': 'always-and-inside-groups',
                consolidateIslands: 'inside-groups',
              },
            ],
            errors: [
              {
                message: 'There should be at least one empty line between import groups',
                line: 4,
              },
              {
                message: 'There should be at least one empty line between import groups',
                line: 5,
              },
              {
                message:
                  'There should be at least one empty line between this import and the multi-line import that follows it',
                line: 6,
              },
              {
                message:
                  'There should be at least one empty line between this multi-line import and the import that follows it',
                line: 12,
              },
              {
                message: 'There should be at least one empty line between import groups',
                line: 13,
              },
              {
                message:
                  'There should be at least one empty line between this multi-line import and the import that follows it',
                line: 15,
              },
            ],
          }),
          // Documentation failing example #2 for consolidateIslands
          test({
            code: `
              import c from 'Bar';
              import d from 'bar';
              import {
                aa,
                bb,
                cc,
                dd,
                ee,
                ff,
                gg
              } from 'baz';
              import {
                hh,
                ii,
                jj,
                kk,
                ll,
                mm,
                nn
              } from 'fizz';
              import a from 'foo';
              import b from 'dirA/bar';
              import index from './';
              import type { AA,
                BB, CC } from 'abc';
              import type { Z } from 'fizz';
              import type {
                A,
                B
              } from 'foo';
              import type { C2 } from 'dirB/Bar';
              import type {
                D2,
                X2,
                Y2
              } from 'dirB/bar';
              import type { E2 } from 'dirB/baz';
              import type { C3 } from 'dirC/Bar';
              import type {
                D3,
                X3,
                Y3
              } from 'dirC/bar';
              import type { E3 } from 'dirC/baz';
              import type { F3 } from 'dirC/caz';
              import type { C1 } from 'dirA/Bar';
              import type {
                D1,
                X1,
                Y1
              } from 'dirA/bar';
              import type { E1 } from 'dirA/baz';
              import type { F } from './index.js';
              import type { G } from './aaa.js';
              import type { H } from './bbb';
            `,
            output: `
              import c from 'Bar';
              import d from 'bar';

              import {
                aa,
                bb,
                cc,
                dd,
                ee,
                ff,
                gg
              } from 'baz';

              import {
                hh,
                ii,
                jj,
                kk,
                ll,
                mm,
                nn
              } from 'fizz';

              import a from 'foo';

              import b from 'dirA/bar';

              import index from './';

              import type { AA,
                BB, CC } from 'abc';

              import type { Z } from 'fizz';

              import type {
                A,
                B
              } from 'foo';

              import type { C2 } from 'dirB/Bar';

              import type {
                D2,
                X2,
                Y2
              } from 'dirB/bar';

              import type { E2 } from 'dirB/baz';
              import type { C3 } from 'dirC/Bar';

              import type {
                D3,
                X3,
                Y3
              } from 'dirC/bar';

              import type { E3 } from 'dirC/baz';
              import type { F3 } from 'dirC/caz';
              import type { C1 } from 'dirA/Bar';

              import type {
                D1,
                X1,
                Y1
              } from 'dirA/bar';

              import type { E1 } from 'dirA/baz';
              import type { F } from './index.js';
              import type { G } from './aaa.js';
              import type { H } from './bbb';
            `,
            ...parserConfig,
            options: [
              {
                alphabetize: { order: 'asc' },
                groups: ['external', 'internal', 'index', 'type'],
                pathGroups: [
                  {
                    pattern: 'dirA/**',
                    group: 'internal',
                    position: 'after',
                  },
                  {
                    pattern: 'dirB/**',
                    group: 'internal',
                    position: 'before',
                  },
                  {
                    pattern: 'dirC/**',
                    group: 'internal',
                  },
                ],
                'newlines-between': 'always-and-inside-groups',
                'newlines-between-types': 'never',
                pathGroupsExcludedImportTypes: [],
                sortTypesGroup: true,
                consolidateIslands: 'inside-groups',
              },
            ],
            errors: [
              {
                message:
                  'There should be at least one empty line between this import and the multi-line import that follows it',
                line: 3,
              },
              {
                message:
                  'There should be at least one empty line between this import and the multi-line import that follows it',
                line: 4,
              },
              {
                message:
                  'There should be at least one empty line between this multi-line import and the import that follows it',
                line: 13,
              },
              {
                message: 'There should be at least one empty line between import groups',
                line: 22,
              },
              {
                message: 'There should be at least one empty line between import groups',
                line: 23,
              },
              {
                message: 'There should be at least one empty line between import groups',
                line: 24,
              },
              {
                message:
                  'There should be at least one empty line between this multi-line import and the import that follows it',
                line: 25,
              },
              {
                message:
                  'There should be at least one empty line between this import and the multi-line import that follows it',
                line: 27,
              },
              {
                message: 'There should be at least one empty line between import groups',
                line: 28,
              },
              {
                message:
                  'There should be at least one empty line between this import and the multi-line import that follows it',
                line: 32,
              },
              {
                message:
                  'There should be at least one empty line between this multi-line import and the import that follows it',
                line: 33,
              },
              {
                message:
                  'There should be at least one empty line between this import and the multi-line import that follows it',
                line: 39,
              },
              {
                message:
                  'There should be at least one empty line between this multi-line import and the import that follows it',
                line: 40,
              },
              {
                message:
                  'There should be at least one empty line between this import and the multi-line import that follows it',
                line: 47,
              },
              {
                message:
                  'There should be at least one empty line between this multi-line import and the import that follows it',
                line: 48,
              },
            ],
          }),

          supportsExportTypeSpecifiers ? [
            test({
              code: `
                export { type B, A };
              `,
              output: `
                export { A, type B };
              `,
              ...parserConfig,
              options: [{
                named: {
                  enabled: true,
                  types: 'mixed',
                },
                alphabetize: { order: 'asc' },
              }],
              errors: [{
                message: '`A` export should occur before type export of `B`',
              }],
            }),
            test({
              code: `
                import { type B, A, default as C } from "./Z";
              `,
              output: `
                import { A, default as C, type B } from "./Z";
              `,
              ...parserConfig,
              options: [{
                named: {
                  import: true,
                  types: 'types-last',
                },
                alphabetize: { order: 'asc' },
              }],
              errors: [{
                message: '`B` type import should occur after import of `default`',
              }],
            }),
            test({
              code: `
                export { A, type Z } from "./Z";
              `,
              output: `
                export { type Z, A } from "./Z";
              `,
              ...parserConfig,
              options: [{
                named: {
                  enabled: true,
                  types: 'types-first',
                },
              }],
              errors: [
                { message: '`Z` type export should occur before export of `A`' },
              ],
            }),
          ] : [],

          isCoreModule('node:child_process') && isCoreModule('node:fs/promises') ? [
            test({
              code: `
                import express from 'express';
                import log4js from 'log4js';
                import chpro from 'node:child_process';
                // import fsp from 'node:fs/promises';
              `,
              output: `
                import chpro from 'node:child_process';
                import express from 'express';
                import log4js from 'log4js';
                // import fsp from 'node:fs/promises';
              `,
              options: [{
                groups: [
                  'builtin',
                  'external',
                  'internal',
                  'parent',
                  'sibling',
                  'index',
                  'object',
                  'type',
                ],
              }],
              errors: [
                { message: '`node:child_process` import should occur before import of `express`' },
                // { message: '`node:fs/promises` import should occur before import of `express`' },
              ],
            }),
          ] : [],
        ),
      });
    });
});

flowRuleTester.run('order', rule, {
  valid: [
    test({
      options: [
        {
          alphabetize: { order: 'asc', orderImportKind: 'asc' },
        },
      ],
      code: `
        import type {Bar} from 'common';
        import typeof {foo} from 'common';
        import {bar} from 'common';
      `,
    })],
  invalid: [
    test({
      options: [
        {
          alphabetize: { order: 'asc', orderImportKind: 'asc' },
        },
      ],
      code: `
        import type {Bar} from 'common';
        import {bar} from 'common';
        import typeof {foo} from 'common';
      `,
      output: `
        import type {Bar} from 'common';
        import typeof {foo} from 'common';
        import {bar} from 'common';
      `,
      errors: [{
        message: '`common` typeof import should occur before import of `common`',
      }],
    }),
    test({
      options: [
        {
          alphabetize: { order: 'asc', orderImportKind: 'desc' },
        },
      ],
      code: `
        import type {Bar} from 'common';
        import {bar} from 'common';
        import typeof {foo} from 'common';
      `,
      output: `
        import {bar} from 'common';
        import typeof {foo} from 'common';
        import type {Bar} from 'common';
      `,
      errors: [{
        message: '`common` type import should occur after typeof import of `common`',
      }],
    }),
    test({
      options: [
        {
          alphabetize: { order: 'asc', orderImportKind: 'asc' },
        },
      ],
      code: `
        import type {Bar} from './local/sub';
        import {bar} from './local/sub';
        import {baz} from './local-sub';
        import typeof {foo} from './local/sub';
      `,
      output: `
        import type {Bar} from './local/sub';
        import typeof {foo} from './local/sub';
        import {bar} from './local/sub';
        import {baz} from './local-sub';
      `,
      errors: [{
        message: '`./local/sub` typeof import should occur before import of `./local/sub`',
      }],
    }),
    test({
      code: `
        import { cfg } from 'path/path/path/src/Cfg';
        import { l10n } from 'path/src/l10n';
        import { helpers } from 'path/path/path/helpers';
        import { tip } from 'path/path/tip';

        import { controller } from '../../../../path/path/path/controller';
        import { component } from '../../../../path/path/path/component';
      `,
      output: semver.satisfies(eslintPkg.version, '< 3') ? `
        import { cfg } from 'path/path/path/src/Cfg';
        import { tip } from 'path/path/tip';
        import { l10n } from 'path/src/l10n';
        import { helpers } from 'path/path/path/helpers';

        import { component } from '../../../../path/path/path/component';
        import { controller } from '../../../../path/path/path/controller';
      ` : `
        import { helpers } from 'path/path/path/helpers';
        import { cfg } from 'path/path/path/src/Cfg';
        import { l10n } from 'path/src/l10n';
        import { tip } from 'path/path/tip';

        import { component } from '../../../../path/path/path/component';
        import { controller } from '../../../../path/path/path/controller';
      `,
      options: [
        {
          groups: [
            ['builtin', 'external'],
            'internal',
            ['sibling', 'parent'],
            'object',
            'type',
          ],
          pathGroups: [
            {
              pattern: 'react',
              group: 'builtin',
              position: 'before',
              patternOptions: {
                matchBase: true,
              },
            },
            {
              pattern: '*.+(css|svg)',
              group: 'type',
              position: 'after',
              patternOptions: {
                matchBase: true,
              },
            },
          ],
          pathGroupsExcludedImportTypes: [],
          alphabetize: {
            order: 'asc',
          },
          'newlines-between': 'always',
        },
      ],
      errors: [
        {
          message: '`path/path/path/helpers` import should occur before import of `path/path/path/src/Cfg`',
          line: 4,
          column: 9,
        },
        {
          message: '`path/path/tip` import should occur before import of `path/src/l10n`',
          line: 5,
          column: 9,
        },
        {
          message: '`../../../../path/path/path/component` import should occur before import of `../../../../path/path/path/controller`',
          line: 8,
          column: 9,
        },
      ],
    }),
  ],
});
