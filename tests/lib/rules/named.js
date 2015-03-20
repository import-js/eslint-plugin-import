"use strict";

var assign = require("object-assign");
var path = require("path");

var linter = require("eslint").linter,
    ESLintTester = require("eslint-tester");

var eslintTester = new ESLintTester(linter);


var FILENAME = path.join(process.cwd(), "./files", "foo.js");
function test(t) {
  return assign({filename: FILENAME, ecmaFeatures: {modules: true}}, t);
}

function error(name, module) {
  return { message: name + " not found in '" + module + "'", type: "Identifier" };
}


eslintTester.addRuleTest("lib/rules/named", {
  valid: [
    test({code: "import { foo } from './bar';"}),
    test({code: "import bar from './bar.js';"}),
    test({code: "import {a, b, d} from './named-exports';"}),
    test({code: "import {ExportedClass} from './named-exports';"}),
    test({code: "import {a, b, d} from './common';"}),
    test({code: "import { ActionTypes } from './qc';"}),
    test({code: "import {a, b, c, d} from './re-export';"}),
    test({code: "import {foo, bar} from './re-export-names';", args: [2, "es6-only"]})
  ],

  invalid: [
    test({code: "import { baz } from './bar';",
      errors: [error("baz", "./bar")]}),

    // test multiple
    test({code: "import { baz, bop } from './bar';",
      errors: [error("baz", "./bar"), error("bop", "./bar")]}),

    test({code: "import {a, b, c} from './named-exports';",
      errors: [error("c", "./named-exports")]}),

    test({code: "import { a } from './default-export';",
      errors: [error("a", "./default-export")]}),

    test({code: "import { a } from './common';", args: [2, "es6-only"],
      errors: [error("a", "./common")]}),

    test({code: "import { ActionTypess } from './qc';",
      errors: [error("ActionTypess", "./qc")]}),

    test({code: "import {a, b, c, d, e} from './re-export';",
      errors: [error("e", "./re-export")]}),

    test({code: "import { a } from './re-export-names';",
      args: [2, "es6-only"],
        errors: [error("a", "./re-export-names")]})
  ]
});
