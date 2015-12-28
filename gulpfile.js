var gulp = require('gulp')
  , changed = require('gulp-changed')
  , babel = require('gulp-babel')
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

gulp.task('wipe-extras', function (done) {
  // glob into 'lib' and delete whatever isn't there
  glob(DEST + '/**/*.js', function (err, files) {
    if (err) {
      done(err); return
    }

    function checkFile(index) {
      if (index >= files.length) {
        done(); return
      }

      var libFilename = files[index]
        , srcFilename = path.resolve('src', path.relative(path.resolve(DEST), libFilename))

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
})

gulp.task('prepublish', ['src', 'wipe-extras'])
gulp.task('default', ['prepublish'])

gulp.task('tests', function () {
  return gulp.src('tests/src/**/*.js')
    .pipe(changed('tests/lib'))
    .pipe(babel())
    .pipe(gulp.dest('tests/lib'))
})

gulp.task('pretest', ['src', 'tests'])

gulp.task('all', ['default', 'pretest'])
