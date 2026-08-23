import { RuleTester } from 'eslint';
import rule from 'rules/no-indexes';

import { test } from '../utils';

const ruleTester = new RuleTester();

ruleTester.run('no-indexes', rule, {
  valid: [
    test({
      code: '',
      filename: 'non-index.js',
    }),
    test({
      code: '',
      filename: '/path-to-ignore/index.js',
      options: [{ ignore: ['path-to-ignore'] }],
    }),
    test({
      code: '',
      filename: '/path-to-ignore/index.js',
      options: [{ ignore: ['\/path\-to\-ignore\/'] }],
    }),
  ],
  invalid: [
    test({
      code: '',
      filename: 'index.js',
      errors: ['Index files are not allowed.'],
    }),
  ],
});
