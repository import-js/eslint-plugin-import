import { RuleTester } from 'eslint';
import { getTSParsers, test } from '../utils';

const ruleTester = new RuleTester();
const rule = require('rules/no-rename-default');

// IMPORT
// anonymous-arrow.js
// anonymous-arrow-async.js
// anonymous-class.js
// anonymous-object.js
// anonymous-primitive.js
ruleTester.run('no-rename-default', rule, {
  valid: [
    test({
      code: `
        import _ from './no-rename-default/anonymous-arrow'
      `,
    }),
    test({
      code: `
        import _ from './no-rename-default/anonymous-arrow-async'
      `,
    }),
    test({
      code: `
        import _ from './no-rename-default/anonymous-class'
      `,
    }),
    test({
      code: `
        import _ from './no-rename-default/anonymous-object'
      `,
    }),
    test({
      code: `
        import _ from './no-rename-default/anonymous-primitive'
      `,
    }),
  ],
  invalid: [],
});

// REQUIRE { commonjs: true }
// anonymous-arrow.js
// anonymous-arrow-async.js
// anonymous-class.js
// anonymous-object.js
// anonymous-primitive.js
ruleTester.run('no-rename-default', rule, {
  valid: [
    test({
      code: `
        const _ = require('./no-rename-default/anonymous-arrow')
      `,
      options: [{ commonjs: true }],
    }),
    test({
      code: `
        const _ = require('./no-rename-default/anonymous-arrow-async')
      `,
      options: [{ commonjs: true }],
    }),
    test({
      code: `
        const _ = require('./no-rename-default/anonymous-class')
      `,
      options: [{ commonjs: true }],
    }),
    test({
      code: `
        const _ = require('./no-rename-default/anonymous-object')
      `,
      options: [{ commonjs: true }],
    }),
    test({
      code: `
        const _ = require('./no-rename-default/anonymous-primitive')
      `,
      options: [{ commonjs: true }],
    }),
  ],
  invalid: [],
});

// IMPORT
// assign-arrow.js
// assign-arrow-async.js
// assign-class.js
// assign-class-named.js
// assign-fn.js
// assign-fn-named.js
// assign-generator.js
// assign-generator-named.js
ruleTester.run('no-rename-default', rule, {
  valid: [
    test({
      code: `
        import arrow from './no-rename-default/assign-arrow'
      `,
    }),
    test({
      code: `
        import arrowAsync from './no-rename-default/assign-arrow-async'
      `,
    }),
    test({
      code: `
        import User from './no-rename-default/assign-class'
      `,
    }),
    test({
      code: `
        import User from './no-rename-default/assign-class-named'
      `,
    }),
    test({
      code: `
        import fn from './no-rename-default/assign-fn'
      `,
    }),
    test({
      code: `
        import fn from './no-rename-default/assign-fn-named'
      `,
    }),
    test({
      code: `
        import generator from './no-rename-default/assign-generator'
      `,
    }),
    test({
      code: `
        import generator from './no-rename-default/assign-generator-named'
      `,
    }),
  ],
  invalid: [
    test({
      code: `
        import myArrow from './no-rename-default/assign-arrow'
      `,
      errors: [{
        message: 'Caution: `assign-arrow.js` has a default export `arrow`. This imports `arrow` as `myArrow`. Check if you meant to write `import arrow from \'./no-rename-default/assign-arrow\'` instead.',
        type: 'ImportDefaultSpecifier',
      }],
    }),
    test({
      code: `
        import myArrowAsync from './no-rename-default/assign-arrow-async'
      `,
      errors: [{
        message: 'Caution: `assign-arrow-async.js` has a default export `arrowAsync`. This imports `arrowAsync` as `myArrowAsync`. Check if you meant to write `import arrowAsync from \'./no-rename-default/assign-arrow-async\'` instead.',
        type: 'ImportDefaultSpecifier',
      }],
    }),
    test({
      code: `
        import MyUser from './no-rename-default/assign-class'
      `,
      errors: [{
        message: 'Caution: `assign-class.js` has a default export `User`. This imports `User` as `MyUser`. Check if you meant to write `import User from \'./no-rename-default/assign-class\'` instead.',
        type: 'ImportDefaultSpecifier',
      }],
    }),
    test({
      code: `
        import MyUser from './no-rename-default/assign-class-named'
      `,
      errors: [{
        message: 'Caution: `assign-class-named.js` has a default export `User`. This imports `User` as `MyUser`. Check if you meant to write `import User from \'./no-rename-default/assign-class-named\'` instead.',
        type: 'ImportDefaultSpecifier',
      }],
    }),
    test({
      code: `
        import myFn from './no-rename-default/assign-fn'
      `,
      errors: [{
        message: 'Caution: `assign-fn.js` has a default export `fn`. This imports `fn` as `myFn`. Check if you meant to write `import fn from \'./no-rename-default/assign-fn\'` instead.',
        type: 'ImportDefaultSpecifier',
      }],
    }),
    test({
      code: `
        import myFn from './no-rename-default/assign-fn-named'
      `,
      errors: [{
        message: 'Caution: `assign-fn-named.js` has a default export `fn`. This imports `fn` as `myFn`. Check if you meant to write `import fn from \'./no-rename-default/assign-fn-named\'` instead.',
        type: 'ImportDefaultSpecifier',
      }],
    }),
    test({
      code: `
        import myGenerator from './no-rename-default/assign-generator'
      `,
      errors: [{
        message: 'Caution: `assign-generator.js` has a default export `generator`. This imports `generator` as `myGenerator`. Check if you meant to write `import generator from \'./no-rename-default/assign-generator\'` instead.',
        type: 'ImportDefaultSpecifier',
      }],
    }),
    test({
      code: `
        import myGenerator from './no-rename-default/assign-generator-named'
      `,
      errors: [{
        message: 'Caution: `assign-generator-named.js` has a default export `generator`. This imports `generator` as `myGenerator`. Check if you meant to write `import generator from \'./no-rename-default/assign-generator-named\'` instead.',
        type: 'ImportDefaultSpecifier',
      }],
    }),
  ],
});

// IMPORT { preventRenamingBindings: false }
// assign-arrow.js
// assign-arrow-async.js
// assign-class.js
// assign-class-named.js
// assign-fn.js
// assign-fn-named.js
// assign-generator.js
// assign-generator-named.js
ruleTester.run('no-rename-default', rule, {
  valid: [
    test({
      code: `
        import myArrow from './no-rename-default/assign-arrow'
      `,
      options: [{ preventRenamingBindings: false }],
    }),
    test({
      code: `
        import myArrowAsync from './no-rename-default/assign-arrow-async'
      `,
      options: [{ preventRenamingBindings: false }],
    }),
    test({
      code: `
        import MyUser from './no-rename-default/assign-class'
      `,
      options: [{ preventRenamingBindings: false }],
    }),
    test({
      code: `
        import MyUser from './no-rename-default/assign-class-named'
      `,
      options: [{ preventRenamingBindings: false }],
    }),
    test({
      code: `
        import myFn from './no-rename-default/assign-fn'
      `,
      options: [{ preventRenamingBindings: false }],
    }),
    test({
      code: `
        import myFn from './no-rename-default/assign-fn-named'
      `,
      options: [{ preventRenamingBindings: false }],
    }),
    test({
      code: `
        import myGenerator from './no-rename-default/assign-generator'
      `,
      options: [{ preventRenamingBindings: false }],
    }),
    test({
      code: `
        import myGenerator from './no-rename-default/assign-generator-named'
      `,
      options: [{ preventRenamingBindings: false }],
    }),
  ],
  invalid: [],
});

// REQUIRE { commonjs: true }
// assign-arrow.js
// assign-arrow-async.js
// assign-class.js
// assign-class-named.js
// assign-fn.js
// assign-fn-named.js
// assign-generator.js
// assign-generator-named.js
ruleTester.run('no-rename-default', rule, {
  valid: [
    test({
      code: `
        const arrow = require('./no-rename-default/assign-arrow')
      `,
      options: [{ commonjs: true }],
    }),
    test({
      code: `
        const arrowAsync = require('./no-rename-default/assign-arrow-async')
      `,
      options: [{ commonjs: true }],
    }),
    test({
      code: `
        const User = require('./no-rename-default/assign-class')
      `,
      options: [{ commonjs: true }],
    }),
    test({
      code: `
        const User = require('./no-rename-default/assign-class-named')
      `,
      options: [{ commonjs: true }],
    }),
    test({
      code: `
        const fn = require('./no-rename-default/assign-fn')
      `,
      options: [{ commonjs: true }],
    }),
    test({
      code: `
        const fn = require('./no-rename-default/assign-fn-named')
      `,
      options: [{ commonjs: true }],
    }),
    test({
      code: `
        const generator = require('./no-rename-default/assign-generator')
      `,
      options: [{ commonjs: true }],
    }),
    test({
      code: `
        const generator = require('./no-rename-default/assign-generator-named')
      `,
      options: [{ commonjs: true }],
    }),
  ],
  invalid: [
    test({
      code: `
        const myArrow = require('./no-rename-default/assign-arrow')
      `,
      options: [{ commonjs: true }],
      errors: [{
        message: 'Caution: `assign-arrow.js` has a default export `arrow`. This requires `arrow` as `myArrow`. Check if you meant to write `const arrow = require(\'./no-rename-default/assign-arrow\')` instead.',
        type: 'VariableDeclarator',
      }],
    }),
    test({
      code: `
        const myArrowAsync = require('./no-rename-default/assign-arrow-async')
      `,
      options: [{ commonjs: true }],
      errors: [{
        message: 'Caution: `assign-arrow-async.js` has a default export `arrowAsync`. This requires `arrowAsync` as `myArrowAsync`. Check if you meant to write `const arrowAsync = require(\'./no-rename-default/assign-arrow-async\')` instead.',
        type: 'VariableDeclarator',
      }],
    }),
    test({
      code: `
        const MyUser = require('./no-rename-default/assign-class')
      `,
      options: [{ commonjs: true }],
      errors: [{
        message: 'Caution: `assign-class.js` has a default export `User`. This requires `User` as `MyUser`. Check if you meant to write `const User = require(\'./no-rename-default/assign-class\')` instead.',
        type: 'VariableDeclarator',
      }],
    }),
    test({
      code: `
        const MyUser = require('./no-rename-default/assign-class-named')
      `,
      options: [{ commonjs: true }],
      errors: [{
        message: 'Caution: `assign-class-named.js` has a default export `User`. This requires `User` as `MyUser`. Check if you meant to write `const User = require(\'./no-rename-default/assign-class-named\')` instead.',
        type: 'VariableDeclarator',
      }],
    }),
    test({
      code: `
        const myFn = require('./no-rename-default/assign-fn')
      `,
      options: [{ commonjs: true }],
      errors: [{
        message: 'Caution: `assign-fn.js` has a default export `fn`. This requires `fn` as `myFn`. Check if you meant to write `const fn = require(\'./no-rename-default/assign-fn\')` instead.',
        type: 'VariableDeclarator',
      }],
    }),
    test({
      code: `
        const myFn = require('./no-rename-default/assign-fn-named')
      `,
      options: [{ commonjs: true }],
      errors: [{
        message: 'Caution: `assign-fn-named.js` has a default export `fn`. This requires `fn` as `myFn`. Check if you meant to write `const fn = require(\'./no-rename-default/assign-fn-named\')` instead.',
        type: 'VariableDeclarator',
      }],
    }),
    test({
      code: `
        const myGenerator = require('./no-rename-default/assign-generator')
      `,
      options: [{ commonjs: true }],
      errors: [{
        message: 'Caution: `assign-generator.js` has a default export `generator`. This requires `generator` as `myGenerator`. Check if you meant to write `const generator = require(\'./no-rename-default/assign-generator\')` instead.',
        type: 'VariableDeclarator',
      }],
    }),
    test({
      code: `
        const myGenerator = require('./no-rename-default/assign-generator-named')
      `,
      options: [{ commonjs: true }],
      errors: [{
        message: 'Caution: `assign-generator-named.js` has a default export `generator`. This requires `generator` as `myGenerator`. Check if you meant to write `const generator = require(\'./no-rename-default/assign-generator-named\')` instead.',
        type: 'VariableDeclarator',
      }],
    }),
  ],
});

// REQUIRE { commonjs: true, preventRenamingBindings: false }
// assign-arrow.js
// assign-arrow-async.js
// assign-class.js
// assign-class-named.js
// assign-fn.js
// assign-fn-named.js
// assign-generator.js
// assign-generator-named.js
ruleTester.run('no-renamed-default', rule, {
  valid: [
    test({
      code: `
        const myArrow = require('./no-rename-default/assign-arrow')
      `,
      options: [{ commonjs: true, preventRenamingBindings: false }],
    }),
    test({
      code: `
        const myArrowAsync = require('./no-rename-default/assign-arrow-async')
      `,
      options: [{ commonjs: true, preventRenamingBindings: false }],
    }),
    test({
      code: `
        const MyUser = require('./no-rename-default/assign-class')
      `,
      options: [{ commonjs: true, preventRenamingBindings: false }],
    }),
    test({
      code: `
        const MyUser = require('./no-rename-default/assign-class-named')
      `,
      options: [{ commonjs: true, preventRenamingBindings: false }],
    }),
    test({
      code: `
        const myFn = require('./no-rename-default/assign-fn')
      `,
      options: [{ commonjs: true, preventRenamingBindings: false }],
    }),
    test({
      code: `
        const myFn = require('./no-rename-default/assign-fn-named')
      `,
      options: [{ commonjs: true, preventRenamingBindings: false }],
    }),
    test({
      code: `
        const myGenerator = require('./no-rename-default/assign-generator')
      `,
      options: [{ commonjs: true, preventRenamingBindings: false }],
    }),
    test({
      code: `
        const myGenerator = require('./no-rename-default/assign-generator-named')
      `,
      options: [{ commonjs: true, preventRenamingBindings: false }],
    }),
  ],
  invalid: [

  ],
});

// IMPORT
// class-user.js
ruleTester.run('no-rename-default', rule, {
  valid: [
    test({
      code: `
        import User from './no-rename-default/class-user'
      `,
    }),
  ],
  invalid: [
    test({
      code: `
        import MyUser from './no-rename-default/class-user'
      `,
      errors: [{
        message: 'Caution: `class-user.js` has a default export `User`. This imports `User` as `MyUser`. Check if you meant to write `import User from \'./no-rename-default/class-user\'` instead.',
        type: 'ImportDefaultSpecifier',
      }],
    }),
  ],
});

// REQUIRE { commonjs: true }
// class-user.js
ruleTester.run('no-rename-default', rule, {
  valid: [
    test({
      code: `
        const User = require('./no-rename-default/class-user')
      `,
      options: [{ commonjs: true }],
    }),
  ],
  invalid: [
    test({
      code: `
        const MyUser = require('./no-rename-default/class-user')
      `,
      options: [{ commonjs: true }],
      errors: [{
        message: 'Caution: `class-user.js` has a default export `User`. This requires `User` as `MyUser`. Check if you meant to write `const User = require(\'./no-rename-default/class-user\')` instead.',
        type: 'VariableDeclarator',
      }],
    }),
  ],
});

// IMPORT
// const-bar.js
// const-foo.js
ruleTester.run('no-rename-default', rule, {
  valid: [
    test({
      code: `
        import foo from './no-rename-default/const-foo'
      `,
    }),
    test({
      code: `
        import { fooNamed1 } from './no-rename-default/const-foo'
      `,
    }),
    test({
      code: `
        import { fooNamed1, fooNamed2 } from './no-rename-default/const-foo'
      `,
    }),
    test({
      code: `
        import { default as foo } from './no-rename-default/const-foo'
      `,
    }),
    test({
      code: `
        import { default as foo, fooNamed1 } from './no-rename-default/const-foo'
      `,
    }),
    test({
      code: `
        import foo, { fooNamed1 } from './no-rename-default/const-foo'
      `,
    }),
    test({
      code: `
        import bar from './no-rename-default/const-bar'
        import foo from './no-rename-default/const-foo'
      `,
    }),
    test({
      code: `
        import bar, { barNamed1 } from './no-rename-default/const-bar'
        import foo, { fooNamed1 } from './no-rename-default/const-foo'
      `,
    }),
  ],
  invalid: [
    test({
      code: `
        import bar from './no-rename-default/const-foo'
      `,
      errors: [{
        message: 'Caution: `const-foo.js` has a default export `foo`. This imports `foo` as `bar`. Check if you meant to write `import foo from \'./no-rename-default/const-foo\'` instead.',
        type: 'ImportDefaultSpecifier',
      }],
    }),
    test({
      code: `
        import { default as bar } from './no-rename-default/const-foo'
      `,
      errors: [{
        message: 'Caution: `const-foo.js` has a default export `foo`. This imports `foo` as `bar`. Check if you meant to write `import { default as foo } from \'./no-rename-default/const-foo\'` instead.',
        type: 'ImportSpecifier',
      }],
    }),
    test({
      code: `
        import { default as bar, fooNamed1 } from './no-rename-default/const-foo'
      `,
      errors: [{
        message: 'Caution: `const-foo.js` has a default export `foo`. This imports `foo` as `bar`. Check if you meant to write `import { default as foo } from \'./no-rename-default/const-foo\'` instead.',
        type: 'ImportSpecifier',
      }],
    }),
    test({
      code: `
        import bar, { fooNamed1 } from './no-rename-default/const-foo'
      `,
      errors: [{
        message: 'Caution: `const-foo.js` has a default export `foo`. This imports `foo` as `bar`. Check if you meant to write `import foo from \'./no-rename-default/const-foo\'` instead.',
        type: 'ImportDefaultSpecifier',
      }],
    }),
    test({
      code: `
        import foo from './no-rename-default/const-bar'
        import bar from './no-rename-default/const-foo'
      `,
      errors: [{
        message: 'Caution: `const-bar.js` has a default export `bar`. This imports `bar` as `foo`. Check if you meant to write `import bar from \'./no-rename-default/const-bar\'` instead.',
        type: 'ImportDefaultSpecifier',
      }, {
        message: 'Caution: `const-foo.js` has a default export `foo`. This imports `foo` as `bar`. Check if you meant to write `import foo from \'./no-rename-default/const-foo\'` instead.',
        type: 'ImportDefaultSpecifier',
      }],
    }),
    test({
      code: `
        import findUsers from './no-rename-default/fn-get-users'
      `,
      errors: [{
        message: 'Caution: `fn-get-users.js` has a default export `getUsers`. This imports `getUsers` as `findUsers`. Check if you meant to write `import getUsers from \'./no-rename-default/fn-get-users\'` instead.',
        type: 'ImportDefaultSpecifier',
      }],
    }),
    test({
      code: `
        import findUsersSync from './no-rename-default/fn-get-users-sync'
      `,
      errors: [{
        message: 'Caution: `fn-get-users-sync.js` has a default export `getUsersSync`. This imports `getUsersSync` as `findUsersSync`. Check if you meant to write `import getUsersSync from \'./no-rename-default/fn-get-users-sync\'` instead.',
        type: 'ImportDefaultSpecifier',
      }],
    }),
    test({
      code: `
        import foo, { barNamed1 } from './no-rename-default/const-bar'
        import bar, { fooNamed1 } from './no-rename-default/const-foo'
      `,
      errors: [{
        message: 'Caution: `const-bar.js` has a default export `bar`. This imports `bar` as `foo`. Check if you meant to write `import bar from \'./no-rename-default/const-bar\'` instead.',
        type: 'ImportDefaultSpecifier',
      }, {
        message: 'Caution: `const-foo.js` has a default export `foo`. This imports `foo` as `bar`. Check if you meant to write `import foo from \'./no-rename-default/const-foo\'` instead.',
        type: 'ImportDefaultSpecifier',
      }],
    }),
  ],
});

// REQUIRE { commonjs: true }
// const-bar.js
// const-foo.js
ruleTester.run('no-rename-default', rule, {
  valid: [
    test({
      code: `
        const foo = require('./no-rename-default/const-foo')
      `,
      options: [{ commonjs: true }],
    }),
    test({
      code: `
        const { fooNamed1 } = require('./no-rename-default/const-foo')
      `,
      options: [{ commonjs: true }],
    }),
    test({
      code: `
        const { fooNamed1, fooNamed2 } = require('./no-rename-default/const-foo')
      `,
      options: [{ commonjs: true }],
    }),
    test({
      code: `
        const { default: foo } = require('./no-rename-default/const-foo')
      `,
      options: [{ commonjs: true }],
    }),
    test({
      code: `
        const { default: foo, fooNamed1 } = require('./no-rename-default/const-foo')
      `,
      options: [{ commonjs: true }],
    }),
    test({
      code: `
        const foo = require('./no-rename-default/const-foo')
        const { fooNamed1 } = require('./no-rename-default/const-foo')
      `,
      options: [{ commonjs: true }],
    }),
    test({
      code: `
        const getUsers = require('./no-rename-default/fn-get-users')
      `,
      options: [{ commonjs: true }],
    }),
    test({
      code: `
        const getUsersSync = require('./no-rename-default/fn-get-users-sync')
      `,
      options: [{ commonjs: true }],
    }),
    test({
      code: `
        const bar = require('./no-rename-default/const-bar')
        const { barNamed1 } = require('./no-rename-default/const-bar')
        const foo = require('./no-rename-default/const-foo')
        const { fooNamed1 } = require('./no-rename-default/const-foo')
      `,
      options: [{ commonjs: true }],
    }),
  ],
  invalid: [
    test({
      code: `
        const bar = require('./no-rename-default/const-foo')
      `,
      options: [{ commonjs: true }],
      errors: [{
        message: 'Caution: `const-foo.js` has a default export `foo`. This requires `foo` as `bar`. Check if you meant to write `const foo = require(\'./no-rename-default/const-foo\')` instead.',
        type: 'VariableDeclarator',
      }],
    }),
    test({
      code: `
        const bar = require('./no-rename-default/const-foo')
        const { fooNamed1 } = require('./no-rename-default/const-foo')
      `,
      options: [{ commonjs: true }],
      errors: [{
        message: 'Caution: `const-foo.js` has a default export `foo`. This requires `foo` as `bar`. Check if you meant to write `const foo = require(\'./no-rename-default/const-foo\')` instead.',
        type: 'VariableDeclarator',
      }],
    }),
    test({
      code: `
        const { default: bar } = require('./no-rename-default/const-foo')
      `,
      options: [{ commonjs: true }],
      errors: [{
        message: 'Caution: `const-foo.js` has a default export `foo`. This requires `foo` as `bar`. Check if you meant to write `const { default: foo } = require(\'./no-rename-default/const-foo\')` instead.',
        type: 'VariableDeclarator',
      }],
    }),
    test({
      code: `
        const { default: bar, fooNamed1 } = require('./no-rename-default/const-foo')
      `,
      options: [{ commonjs: true }],
      errors: [{
        message: 'Caution: `const-foo.js` has a default export `foo`. This requires `foo` as `bar`. Check if you meant to write `const { default: foo } = require(\'./no-rename-default/const-foo\')` instead.',
        type: 'VariableDeclarator',
      }],
    }),
    test({
      code: `
        const foo = require('./no-rename-default/const-bar')
        const bar = require('./no-rename-default/const-foo')
      `,
      options: [{ commonjs: true }],
      errors: [{
        message: 'Caution: `const-bar.js` has a default export `bar`. This requires `bar` as `foo`. Check if you meant to write `const bar = require(\'./no-rename-default/const-bar\')` instead.',
        type: 'VariableDeclarator',
      }, {
        message: 'Caution: `const-foo.js` has a default export `foo`. This requires `foo` as `bar`. Check if you meant to write `const foo = require(\'./no-rename-default/const-foo\')` instead.',
        type: 'VariableDeclarator',
      }],
    }),
    test({
      code: `
        const foo = require('./no-rename-default/const-bar')
        const { barNamed1 } = require('./no-rename-default/const-bar')
        const bar = require('./no-rename-default/const-foo')
        const { fooNamed1 } = require('./no-rename-default/const-foo')
      `,
      options: [{ commonjs: true }],
      errors: [{
        message: 'Caution: `const-bar.js` has a default export `bar`. This requires `bar` as `foo`. Check if you meant to write `const bar = require(\'./no-rename-default/const-bar\')` instead.',
        type: 'VariableDeclarator',
      }, {
        message: 'Caution: `const-foo.js` has a default export `foo`. This requires `foo` as `bar`. Check if you meant to write `const foo = require(\'./no-rename-default/const-foo\')` instead.',
        type: 'VariableDeclarator',
      }],
    }),
  ],
});

// IMPORT
// fn-get-users.js
// fn-get-users-sync.js
ruleTester.run('no-rename-default', rule, {
  valid: [
    test({
      code: `
        import getUsers from './no-rename-default/fn-get-users'
      `,
    }),
    test({
      code: `
        import getUsersSync from './no-rename-default/fn-get-users-sync'
      `,
    }),
  ],
  invalid: [
    test({
      code: `
        import findUsers from './no-rename-default/fn-get-users'
      `,
      errors: [{
        message: 'Caution: `fn-get-users.js` has a default export `getUsers`. This imports `getUsers` as `findUsers`. Check if you meant to write `import getUsers from \'./no-rename-default/fn-get-users\'` instead.',
        type: 'ImportDefaultSpecifier',
      }],
    }),
    test({
      code: `
        import findUsersSync from './no-rename-default/fn-get-users-sync'
      `,
      errors: [{
        message: 'Caution: `fn-get-users-sync.js` has a default export `getUsersSync`. This imports `getUsersSync` as `findUsersSync`. Check if you meant to write `import getUsersSync from \'./no-rename-default/fn-get-users-sync\'` instead.',
        type: 'ImportDefaultSpecifier',
      }],
    }),
  ],
});

// REQUIRE { commonjs: true }
// fn-get-users.js
// fn-get-users-sync.js
ruleTester.run('no-rename-default', rule, {
  valid: [
    test({
      code: `
        const getUsers = require('./no-rename-default/fn-get-users')
      `,
      options: [{ commonjs: true }],
    }),
    test({
      code: `
        const getUsersSync = require('./no-rename-default/fn-get-users-sync')
      `,
      options: [{ commonjs: true }],
    }),
  ],
  invalid: [
    test({
      code: `
        const findUsers = require('./no-rename-default/fn-get-users')
      `,
      options: [{ commonjs: true }],
      errors: [{
        message: 'Caution: `fn-get-users.js` has a default export `getUsers`. This requires `getUsers` as `findUsers`. Check if you meant to write `const getUsers = require(\'./no-rename-default/fn-get-users\')` instead.',
        type: 'VariableDeclarator',
      }],
    }),
    test({
      code: `
        const findUsersSync = require('./no-rename-default/fn-get-users-sync')
      `,
      options: [{ commonjs: true }],
      errors: [{
        message: 'Caution: `fn-get-users-sync.js` has a default export `getUsersSync`. This requires `getUsersSync` as `findUsersSync`. Check if you meant to write `const getUsersSync = require(\'./no-rename-default/fn-get-users-sync\')` instead.',
        type: 'VariableDeclarator',
      }],
    }),
  ],
});

// IMPORT
// generator-reader.js
ruleTester.run('no-rename-default', rule, {
  valid: [
    test({
      code: `
        import reader from './no-rename-default/generator-reader'
      `,
    }),
  ],
  invalid: [
    test({
      code: `
        import myReader from './no-rename-default/generator-reader'
      `,
      errors: [{
        message: 'Caution: `generator-reader.js` has a default export `reader`. This imports `reader` as `myReader`. Check if you meant to write `import reader from \'./no-rename-default/generator-reader\'` instead.',
        type: 'ImportDefaultSpecifier',
      }],
    }),
  ],
});

// REQUIRE { commonjs: true }
// generator-reader.js
ruleTester.run('no-rename-default', rule, {
  valid: [
    test({
      code: `
        const reader = require('./no-rename-default/generator-reader')
      `,
      options: [{ commonjs: true }],
    }),
  ],
  invalid: [
    test({
      code: `
        const myReader = require('./no-rename-default/generator-reader')
      `,
      options: [{ commonjs: true }],
      errors: [{
        message: 'Caution: `generator-reader.js` has a default export `reader`. This requires `reader` as `myReader`. Check if you meant to write `const reader = require(\'./no-rename-default/generator-reader\')` instead.',
        type: 'VariableDeclarator',
      }],
    }),
  ],
});

//------------------------------------------------------------------------------
// PR_FEEDBACK
//------------------------------------------------------------------------------

// IMPORT
// binding-const-rename-fn.js
ruleTester.run('no-rename-default', rule, {
  valid: [
    test({
      code: `
        import foo from './no-rename-default/pr-3006-feedback/binding-const-rename-fn'
      `,
    }),
  ],
  invalid: [],
});

// REQUIRE { commonjs: true }
// binding-const-rename-fn.js
ruleTester.run('no-rename-default', rule, {
  valid: [
    test({
      code: `
        const foo = require('./no-rename-default/pr-3006-feedback/binding-const-rename-fn')
      `,
      options: [{ commonjs: true, preventRenamingBindings: false }],
    }),
  ],
  invalid: [],
});

// IMPORT
// binding-hoc-with-logger-for-foo.js
// binding-hoc-with-logger-for-get-users.js
// binding-hoc-with-logger-with-auth-for-get-users.js
ruleTester.run('no-rename-default', rule, {
  valid: [
    test({
      code: `
        import foo from './no-rename-default/pr-3006-feedback/binding-hoc-with-logger-for-foo'
      `,
    }),
    test({
      code: `
        import getUsers from './no-rename-default/pr-3006-feedback/binding-hoc-with-logger-for-get-users'
      `,
    }),
    test({
      code: `
        import getUsers from './no-rename-default/pr-3006-feedback/binding-hoc-with-logger-with-auth-for-get-users'
      `,
    }),
  ],
  invalid: [

  ],
});

// REQUIRE { commonjs: true }
// binding-hoc-with-logger-for-foo.js
// binding-hoc-with-logger-for-get-users.js
// binding-hoc-with-logger-with-auth-for-get-users.js
ruleTester.run('no-rename-default', rule, {
  valid: [
    test({
      code: `
        const foo = require('./no-rename-default/pr-3006-feedback/binding-hoc-with-logger-for-foo')
      `,
      options: [{ commonjs: true }],
    }),
    test({
      code: `
        const getUsers = require('./no-rename-default/pr-3006-feedback/binding-hoc-with-logger-for-get-users')
      `,
      options: [{ commonjs: true }],
    }),
    test({
      code: `
        const getUsers = require('./no-rename-default/pr-3006-feedback/binding-hoc-with-logger-with-auth-for-get-users')
      `,
      options: [{ commonjs: true }],
    }),
  ],
  invalid: [],
});

// IMPORT { preventRenamingBindings: false }
// binding-fn-rename.js
ruleTester.run('no-rename-default', rule, {
  valid: [
    test({
      code: `
        import _ from './no-rename-default/pr-3006-feedback/binding-fn-rename'
      `,
      options: [{ preventRenamingBindings: false }],
    }),
  ],
  invalid: [],
});

// REQUIRE { commonjs: true, preventRenamingBindings: false }
// binding-fn-rename.js
ruleTester.run('no-rename-default', rule, {
  valid: [
    test({
      code: `
        const _ = require('./no-rename-default/pr-3006-feedback/binding-fn-rename')
      `,
      options: [{ commonjs: true, preventRenamingBindings: false }],
    }),
  ],
  invalid: [],
});

context('TypeScript', function () {
  // IMPORT
  // typescript-default.d.ts
  getTSParsers().forEach((parser) => {
    ruleTester.run('no-rename-default', rule, {
      valid: [
        test({
          code: `
            import foo from './no-rename-default/typescript-default'
          `,
          parser,
          settings: {
            'import/parsers': { [parser]: ['.ts'] },
            'import/resolver': { 'eslint-import-resolver-typescript': true },
          },
        }),
      ],
      invalid: [],
    });
  });
});
