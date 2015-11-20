import { expect } from 'chai'
import resolve from 'core/resolve'

import * as utils from '../utils'

describe('resolve', function () {
  it('should throw on bad parameters.', function () {
    expect(resolve.bind(null, null, null)).to.throw(Error)
  })

  it('respects import/resolve extensions', function () {
    var file = resolve( './jsx/MyCoolComponent'
                      , utils.testContext({ 'import/resolve': { 'extensions': ['.jsx'] }})
                      )

    expect(file).to.equal(utils.testFilePath('./jsx/MyCoolComponent.jsx'))
  })

  it('should test case sensitivity', function () {
    // Note the spelling error 'MyUncoolComponent' vs 'MyUnCoolComponent'
    var file = resolve( './jsx/MyUncoolComponent'
                      , utils.testContext({ 'import/resolve': { 'extensions': ['.jsx'] }})
                      )

    expect(file, 'path to ./jsx/MyUncoolComponent').to.be.undefined
  })
})
