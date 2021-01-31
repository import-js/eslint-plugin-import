import { test } from '../utils'

import { RuleTester } from 'eslint'

const ruleTester = new RuleTester()
const rule = require('rules/enforce-import-name')

ruleTester.run('enforce-import-name', rule, {
  valid: [
    test({
      code: `import PropTypes from 'prop-types';`,
      options: [],
    }),
    test({
      code: `import PropTypes from 'prop-types';`,
      options: [{'foo': 'Foo'}],
    }),
    test({
      code: `import PropTypes from 'prop-types';`,
      options: [{'prop-types': 'PropTypes'}],
    }),
    test({
      code: `import PropTypes, {Foo} from 'prop-types';`,
      options: [{'prop-types': 'PropTypes'}],
    }),
    test({
      code: `import {default as PropTypes} from 'prop-types';`,
      options: [{'prop-types': 'PropTypes'}],
    }),
    test({
      code: `import {Foo} from 'prop-types';`,
      options: [{'prop-types': 'PropTypes'}],
    }),
    test({
      code: `import {Foo, default as PropTypes} from 'prop-types';`,
      options: [{'prop-types': 'PropTypes'}],
    }),
    test({
      code: `import * as PropTypes from 'prop-types';`,
      options: [{'prop-types': 'PropTypes'}],
    }),
    test({
      code: `import * as propTypes from 'prop-types';`,
      options: [{'prop-types': 'PropTypes'}],
    }),
    test({
      code: `const PropTypes = require('prop-types');`,
      options: [{'prop-types': 'PropTypes'}],
    }),
    test({
      code: `const object = require('prop-types').object;`,
      options: [{'prop-types': 'PropTypes'}],
    }),
    test({
      code: `const PropTypes = require('prop-types');`,
      options: [],
    }),
    test({
      code: `require('prop-types');`,
      options: [{'prop-types': 'PropTypes'}],
    }),
  ],
  invalid: [
    test({
      code: `import propTypes from 'prop-types';`,
      options: [{'prop-types': 'PropTypes'}],
      output: `import PropTypes from 'prop-types';`,
      errors: [`Default import from 'prop-types' should be aliased to PropTypes, not propTypes`],
    }),
    test({
      code: `const propTypes = require('prop-types');`,
      options: [{'prop-types': 'PropTypes'}],
      output: `const PropTypes = require('prop-types');`,
      errors: [`Default import from 'prop-types' should be aliased to PropTypes, not propTypes`],
    }),
    test({
      code: `import propTypes, {B} from 'prop-types';`,
      options: [{'prop-types': 'PropTypes'}],
      output: `import PropTypes, {B} from 'prop-types';`,
      errors: [`Default import from 'prop-types' should be aliased to PropTypes, not propTypes`],
    }),
    test({
      code: `import {default as propTypes} from 'prop-types';`,
      options: [{'prop-types': 'PropTypes'}],
      output: `import {default as PropTypes} from 'prop-types';`,
      errors: [`Default import from 'prop-types' should be aliased to PropTypes, not propTypes`],
    }),
    test({
      code: `import {default as propTypes, foo} from 'prop-types';`,
      options: [{'prop-types': 'PropTypes'}],
      output: `import {default as PropTypes, foo} from 'prop-types';`,
      errors: [`Default import from 'prop-types' should be aliased to PropTypes, not propTypes`],
    }),
    test({
      code: `import propTypes from 'prop-types';import foo from 'foo';`,
      options: [{'prop-types': 'PropTypes', 'foo': 'Foo'}],
      output: `import PropTypes from 'prop-types';import Foo from 'foo';`,
      errors: [
        `Default import from 'prop-types' should be aliased to PropTypes, not propTypes`,
        `Default import from 'foo' should be aliased to Foo, not foo`,
      ],
    }),
    test({
      code: `
      import propTypes from 'prop-types';

      const obj = {
        foo: propTypes.string
      }
      `,
      options: [{'prop-types': 'PropTypes'}],
      output: `
      import PropTypes from 'prop-types';

      const obj = {
        foo: PropTypes.string
      }
      `,
      errors: [
        `Default import from 'prop-types' should be aliased to PropTypes, not propTypes`,
        `Using incorrect binding name 'propTypes' instead of PropTypes for default import from package prop-types`,
      ],
    }),
    test({
      code: `
      import propTypes from 'prop-types';

      const obj = {
        foo: propTypes.string
      }

      export {propTypes};
      `,
      options: [{'prop-types': 'PropTypes'}],
      output: `
      import propTypes from 'prop-types';

      const obj = {
        foo: propTypes.string
      }

      export {propTypes};
      `,
      errors: [
        `Default import from 'prop-types' should be aliased to PropTypes, not propTypes`,
        `Using incorrect binding name 'propTypes' instead of PropTypes for default import from package prop-types`,
        `Using incorrect binding name 'propTypes' instead of PropTypes for default import from package prop-types`,
      ],
    }),
    test({
      code: `
      import propTypes from 'prop-types';

      const obj = {
        foo: propTypes.string
      }

      export {propTypes as PropTypes, obj};
      `,
      options: [{'prop-types': 'PropTypes'}],
      output: `
      import PropTypes from 'prop-types';

      const obj = {
        foo: PropTypes.string
      }

      export {PropTypes as PropTypes, obj};
      `,
      errors: [
        `Default import from 'prop-types' should be aliased to PropTypes, not propTypes`,
        `Using incorrect binding name 'propTypes' instead of PropTypes for default import from package prop-types`,
        `Using incorrect binding name 'propTypes' instead of PropTypes for default import from package prop-types`,
      ],
    }),
    test({
      code: `
      import propTypes from 'prop-types';

      const obj = {
        foo: propTypes.string
      }

      export function props() {
        return propTypes;
      };

      export class A {
        get b() {
          return propTypes.number;
        }
      };
      `,
      options: [{'prop-types': 'PropTypes'}],
      output: `
      import PropTypes from 'prop-types';

      const obj = {
        foo: PropTypes.string
      }

      export function props() {
        return PropTypes;
      };

      export class A {
        get b() {
          return PropTypes.number;
        }
      };
      `,
      errors: [
        `Default import from 'prop-types' should be aliased to PropTypes, not propTypes`,
        `Using incorrect binding name 'propTypes' instead of PropTypes for default import from package prop-types`,
        `Using incorrect binding name 'propTypes' instead of PropTypes for default import from package prop-types`,
        `Using incorrect binding name 'propTypes' instead of PropTypes for default import from package prop-types`,
      ],
    }),
    test({
      code: `
      const func = function (require) {
        const b = require();
      };

      const propTypes = require('prop-types');
      `,
      options: [{'prop-types': 'PropTypes'}],
      output: `
      const func = function (require) {
        const b = require();
      };

      const PropTypes = require('prop-types');
      `,
      errors: [`Default import from 'prop-types' should be aliased to PropTypes, not propTypes`],
    }),
    test({
      code: `
      const propTypes = require('prop-types');

      const obj = {
        foo: propTypes.string
      }
      `,
      options: [{'prop-types': 'PropTypes'}],
      output: `
      const PropTypes = require('prop-types');

      const obj = {
        foo: PropTypes.string
      }
      `,
      errors: [
        `Default import from 'prop-types' should be aliased to PropTypes, not propTypes`,
        `Using incorrect binding name 'propTypes' instead of PropTypes for default import from package prop-types`,
      ],
    }),
    test({
      code: `
      import foo from 'bar';
      const a = foo.foo();
      const b = bar(foo);
      const c = (foo) => {
          foo();
      };
      c(foo)
      const d = (bar) => {
          bar();
      };
      d(foo);
      const e = () => {
          foo();
      };
      `,
      options: [{'bar': 'Foo'}],
      output: `
      import Foo from 'bar';
      const a = Foo.foo();
      const b = bar(Foo);
      const c = (foo) => {
          foo();
      };
      c(Foo)
      const d = (bar) => {
          bar();
      };
      d(Foo);
      const e = () => {
          Foo();
      };
      `,
      errors: [
        `Default import from 'bar' should be aliased to Foo, not foo`,
        `Using incorrect binding name 'foo' instead of Foo for default import from package bar`,
        `Using incorrect binding name 'foo' instead of Foo for default import from package bar`,
        `Using incorrect binding name 'foo' instead of Foo for default import from package bar`,
        `Using incorrect binding name 'foo' instead of Foo for default import from package bar`,
        `Using incorrect binding name 'foo' instead of Foo for default import from package bar`,
      ],
    }),
  ],
})
