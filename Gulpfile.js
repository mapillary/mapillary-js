var gulp = require('gulp')

var browserify = require('browserify')
var source = require('vinyl-source-stream')
var serve = require('gulp-serve')
var ts = require('gulp-typescript')
var tslint = require('gulp-tslint')

var paths = {
  ts: {
    src: './src/**/*.ts',
    dest: 'dist'
  },
  devFiles: {
    src: ['./dist/mapillary-js.css', './dist/bundle.js'],
    dest: 'debug'
  }
}

gulp.task('copy-dev-files', ['browserify'], function () {
  return gulp.src(paths.devFiles.src)
    .pipe(gulp.dest(paths.devFiles.dest))
})

gulp.task('serve', serve('debug'))

gulp.task('ts-lint', function () {
  return gulp.src(paths.ts.src)
    .pipe(tslint())
	  .pipe(tslint.report('verbose'))
})

gulp.task('typescript', function () {
  gulp.src(paths.ts.src)
    .pipe(ts({
      noImplicitAny: true,
      target: 'ES5',
      module: 'commonjs'
    }))
    .pipe(gulp.dest(paths.ts.dest))
})

gulp.task('watch', function () {
  gulp.watch(paths.ts.src, ['ts-lint', 'typescript', 'browserify', 'copy-dev-files'])
})

gulp.task('browserify', ['typescript'], function () {
  return bundler = browserify({
    entries: './dist/mapillary-js/Viewer.js',
    debug: true,
    fullPaths: false,
    insertGlobals: true
  })
  .bundle()
  .pipe(source('bundle.js'))
  .pipe(gulp.dest('./dist/'))
})

gulp.task('default', ['serve', 'watch', 'typescript', 'browserify', 'copy-dev-files'])