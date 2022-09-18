import { test, parsers } from '../utils';

import { RuleTester } from 'eslint';

const ruleTester = new RuleTester();
const rule = require('rules/named-order');

ruleTester.run('named-order', rule, {
  valid: [
  ],
  invalid: [
  ],
});
