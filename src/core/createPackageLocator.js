import path from 'path'
import fs from 'fs'
import { EOL } from 'os'

class PackageLocator {
  readPackageSync(location) {
    return {
      result: JSON.parse(fs.readFileSync(location, 'utf8')),
      location,
    }
  }

  readPackageUpSync(dirname) {
    const locations = []

    do {
      try {
        const location = path.join(dirname, 'package.json')
        locations.push(location)

        return this.readPackageSync(location)
      } catch (err) {
        // if not found, allopw search to continue
        if (err.code !== 'ENOENT') throw err
      }
    } while (dirname !== (dirname = path.dirname(dirname)))

    const notFoundError = new Error(`No such file or directory: ${EOL}${locations.join(EOL)}`)
    notFoundError.code = 'ENOENT'

    throw notFoundError
  }
}

class CachedPackageLocator extends PackageLocator {
  constructor() {
    super()

    this.store = {}
    this.requests = new Map()
  }

  readPackageSync(location) {
    const cached = this.store[location]
    if (cached) return cached

    const response = super.readPackageSync(location)
    this.store[location] = response.result
    return response
  }

  readPackageUpSync(dirname) {
    const cached = this.requests.get(dirname)
    if (cached) return cached

    const response = super.readPackageUpSync(dirname)
    this.requests.set(dirname, this.store[response.location.toLowerCase])
    return response
  }

  clear() {
    this.requests.clear()
    this.store = {}
  }
}

export default function createPackageLocator(cache) {
  return cache ? new CachedPackageLocator() : new PackageLocator()
}
