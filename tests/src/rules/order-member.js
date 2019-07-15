import { test } from '../utils';
import { RuleTester } from 'eslint';

const ruleTester = new RuleTester();
const rule = require('rules/order-member');

ruleTester.run('importOrder', rule, {
  valid: [
    test({
      code: "import { A, Z, a, b, c as z, d } from 'file';",
    }),
    test({
      code: "import { a, b, c as z, d } from 'file';",
    }),
    test({
      code: "import { a, A, B, b } from 'file';",
      options: [{ caseInsensitive: true }],
    }),
    test({
      code: "import defaultImport from 'file';",
    }),
    test({
      code: "import * as namespaceImport from 'file';",
    }),
    test({
      code: "import defaultImport, * as namespaceImport from 'file';",
    }),
    test({
      code: "import defaultImport, { a, b, c as z, d } from 'file';",
      options: [{ caseInsensitive: true }],
    }),
  ],
  invalid: [
    test({
      code: "import { c, a } from 'file'",
      options: [{ caseInsensitive: true }],
      output: "import { a, c } from 'file'",
      errors: [{ messageId: 'notInOrder' }],
    }),
    test({
      // sort must be stable
      code: "import { aa, c, Aa, B as z, b } from 'file'",
      options: [{ caseInsensitive: true }],
      output: "import { aa, Aa, B as z, b, c } from 'file'",
      errors: [{ messageId: 'notInOrder' }],
    }),
    test({
      code: "import defaultImport, { a, z, e, b, q } from 'file';",
      output: "import defaultImport, { a, b, e, q, z } from 'file';",
      errors: [{ messageId: 'notInOrder' }],
    }),
    test({
      code: "import defaultImport, { a, z, Z, e, A, b, q } from 'file';",
      output: "import defaultImport, { A, Z, a, b, e, q, z } from 'file';",
      errors: [{ messageId: 'notInOrder' }],
    }),
  ],
});
