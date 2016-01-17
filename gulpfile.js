var gulp = require('gulp')
  , changed = require('gulp-changed')
  , babel = require('gulp-babel')
  , mocha = require('gulp-mocha')
  , path = require('path')
  , glob = require('glob')
  , fs = require('fs')

var SRC = 'src/**/*.js'
  , DEST = 'lib'

gulp.task('src', function () {
  return gulp.src(SRC)
    .pipe(changed(DEST))
    .pipe(babel())
    .pipe(gulp.dest(DEST))
})

/**
 * Delete any file under `dest` that has no corresponding file in `src`.
 * I.E. remove generated files that have been orphaned via deletion of their source.
 * @param  {string}   src
 * @param  {string}   dest
 * @param  {Function} done - callback upon completion
 */
function wipeExtras(src, dest, done) {
  // glob into 'lib' and delete whatever isn't there
  glob(dest + '/**/*.js', function (err, files) {
    if (err) {
      done(err); return
    }

    function checkFile(index) {
      if (index >= files.length) {
        done(); return
      }

      var libFilename = files[index]
        , srcFilename = path.resolve(src, path.relative(path.resolve(dest), libFilename))

      fs.stat(srcFilename, function (err) {
        if (err) {
          fs.unlink(libFilename, function () {
            checkFile(index + 1)
          })
        } else {
          checkFile(index + 1)
        }
      })
    }


    checkFile(0)
  })
}

gulp.task('wipe-extras', function (done) {
  var unfinished = 2
  function megadone(err) {
    if (err) { done(err); return }
    if (--unfinished === 0) done()
  }
  wipeExtras('src', DEST, megadone)
  wipeExtras('tests/src', 'tests/lib', megadone)
})

gulp.task('prepublish', ['src', 'wipe-extras'])

gulp.task('tests', function () {
  return gulp.src('tests/src/**/*.js')
    .pipe(changed('tests/lib'))
    .pipe(babel())
    .pipe(gulp.dest('tests/lib'))
})

// used externally by Istanbul, too
gulp.task('pretest', ['src', 'tests', 'wipe-extras'])

gulp.task('test', ['pretest'], function () {
  return gulp.src('tests/lib/**/*.js', { read: false })
    .pipe(mocha({ reporter: 'dot' }))
  // NODE_PATH=./lib mocha --recursive --reporter dot tests/lib/
})

gulp.task('watch-test', function () {
  gulp.watch(SRC, ['test'])
  gulp.watch('tests/' + SRC, ['test'])
})
