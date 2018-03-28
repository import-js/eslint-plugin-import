import path from 'path'
import os from 'os'
import fs from 'fs'

export default class CachedPackageLocator {
  constructor() {
    this.store = {}
  }

  readUpSync(context, dirname, immediate, reduce) {
    const locations = []
    do {
      const location = path.join(dirname, 'package.json')

      if (this.store[location]) {
        return this.store[location]
      }

      locations.push(location)
      if (this.store[location] === null) {
        continue
      }

      try {
        this.store[location] = reduce(
          JSON.parse(fs.readFileSync(location, 'utf8'))
        )

        if (this.store[location]) {
          return this.store[location]
        }
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
        } else {
          // dont swallow unknown error
          throw err
        }
      }
    } while (dirname !== (dirname = path.dirname(dirname)))

    context.report({
      message: `Could not find package.json files: ${os.EOL}${locations.join(os.EOL)}`,
      loc: { line: 0, column: 0 },
    })
  }
}
