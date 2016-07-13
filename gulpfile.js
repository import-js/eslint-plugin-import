var gulp = require('gulp')
  , babel = require('gulp-babel')
  , rimraf = require('rimraf')

var SRC = 'src/**/*.js'
  , DEST = 'lib'

gulp.task('src', ['clean'], function () {
  return gulp.src(SRC)
    .pipe(babel())
    .pipe(gulp.dest(DEST))
})

gulp.task('clean', function (done) {
  rimraf(DEST, done)
})

gulp.task('prepublish', ['src'])
