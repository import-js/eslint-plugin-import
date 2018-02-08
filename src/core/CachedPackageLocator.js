import path from 'path'
import fs from 'fs'
import os from 'os'

export default class CachedPackageLocator {
  constructor() {
    this.store = {}
  }

  readUpSync(context, dirname, immediate, reduce) {
    const locations = []

    do {
      const location = path.join(dirname, 'package.json')

      try {
        if (this.store[location]) {
          return this.store[location]
        }

        locations.push(location)
        if (this.store[location] === null) {
          continue
        }

        return this.store[location] = reduce(
          JSON.parse(fs.readFileSync(location, 'utf8'))
        )
      } catch (err) {
        if (err.code === 'ENOENT') {
          this.store[location] = null

          if (immediate) {
            context.report({
              message: 'Could not find package.json file: ' + location,
              loc: { line: 0, column: 0 },
            })
            return
          }
        } else if (err instanceof SyntaxError) {
          context.report({
            message: 'Could not parse package.json file: ' + err.message + ': ' + location,
            loc: { line: 0, column: 0 },
          })
          return
        }
      }
    } while (dirname !== (dirname = path.dirname(dirname)))

    context.report({
      message: `Could not find package.json files: ${os.EOL}${locations.join(os.EOL)}`,
      loc: { line: 0, column: 0 },
    })
  }
}
