import first from './first'

const newMeta = Object.assign({}, first.meta, { deprecated: true })

module.exports = Object.assign({}, first, { meta: newMeta })
