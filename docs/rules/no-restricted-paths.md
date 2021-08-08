# import/no-restricted-paths: Restrict which files can be imported in a given folder

Some projects contain files which are not always meant to be executed in the same environment.
For example consider a web application that contains specific code for the server and some specific code for the browser/client. In this case you don’t want to import server-only files in your client code.

In order to prevent such scenarios this rule allows you to define restricted zones where you can forbid files from imported if they match a specific path.

## Rule Details

This rule has one option. The option is an object containing the definition of all restricted `zones` and the optional `basePath` which is used to resolve relative paths within.
The default value for `basePath` is the current working directory.
Each zone consists of the `target` path and a `from` path. The `target` is the path where the restricted imports should be applied. The `from` path defines the folder that is not allowed to be used in an import. An optional `except` may be defined for a zone, allowing exception paths or glob patterns that would otherwise violate the related `from`. Note that `except` is relative to `from` and cannot backtrack to a parent directory.
You may also specify an optional `message` for a zone, which will be displayed in case of the rule violation.

## Examples

### Basic example

Given the following folder structure:

```
my-project
├── client
│   └── homepage.js
│   └── about.js
└── server
    └── api.js
```

and the current file being linted is `my-project/client/homepage.js`.

and the configuration set to:

```js
{ "zones": [ {
    "target": "./client",
    "from": "./server"
} ] }
```

#### The following patterns are considered problems (with the above setup):

```js
import api from '../server/api';
```

#### The following patterns are not considered problems (with the above setup):

```js
import about from './about';
```

### Example with exceptions

Given the following folder structure:

```
my-project
├── client
│   └── homepage.js
│   └── about.js
└── server
    ├── api
    │   └── a.js
    │   └── b.js
    │   └── types.js
    └── helper
        └── a.js
        └── b.js
```

and the current file being linted is `my-project/client/homepage.js`.

and the current configuration is set to:

```js
{ "zones": [ {
    "target": "./client",
    "from": "./server",
    "except": ["./helper", "**/types.js"] // relative from "from" path
} ] }
```

#### The following patterns are considered problems (with the above setup):

```js
import a from '../server/api/a'
```

#### The following patterns are not considered problems (with the above setup):

```js
import { MyType } from '../server/api/types'
import a from '../server/helpers/a'
```
