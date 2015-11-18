import resolve from 'resolve'

export default function resolveImport(source, file, settings) {
  if (resolve.isCore(source)) return null

  return resolve.sync(source, opts(file, settings))
}

function opts(basedir, settings) {
  // pulls all items from 'import/resolve'
  return Object.assign( {}
                      , settings && settings['import/resolve']
                      , { basedir: basedir }
                      )
}

