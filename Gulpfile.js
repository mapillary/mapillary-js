var gulp = require('gulp')

var browserify = require('browserify')
var del = require('del');
var documentation = require('gulp-documentation')
var source = require('vinyl-source-stream')
var serve = require('gulp-serve')
var standard = require('gulp-standard')
var ts = require('gulp-typescript')
var rename = require('gulp-rename')
var tsd = require('gulp-tsd')
var tslint = require('gulp-tslint')

var paths = {
  mapillaryjs: 'mapillaryjs',
  ts: {
    src: './src/**/*.ts',
    tests: './spec/**/*.ts',
    dest: 'dist'
  },
  devFiles: {
    src: ['./dist/mapillary-js.css', './dist/bundle.js'],
    dest: 'debug'
  }
}

var config = {
  ts: {
      noImplicitAny: true,
      target: 'ES5',
      module: 'commonjs'
    }
}

gulp.task('clean', function () {
  return del([
    'html-documentation',
    'dist/**/*',
    'debug/**/*.js'
  ])
})

gulp.task('copy-dev-files', ['browserify'], function () {
  return gulp.src(paths.devFiles.src)
    .pipe(gulp.dest(paths.devFiles.dest))
})

gulp.task('serve', ['tsd'], serve('.'))

gulp.task('js-lint', function () {
  return gulp.src('./Gulpfile.js')
    .pipe(standard())
    .pipe(standard.reporter('default', {
      breakOnError: true
    }))
})

gulp.task('ts-lint', ['tsd'], function () {
  return gulp.src(paths.ts.src)
    .pipe(tslint())
    .pipe(tslint.report('verbose'))
})

gulp.task('typescript', ['ts-lint', 'ts-test'], function () {
  gulp.src(paths.ts.src)
    .pipe(ts(config.ts))
    .pipe(gulp.dest(paths.ts.dest))
})

gulp.task('ts-test', ['tsd'], function () {
  gulp.src(paths.ts.tests)
    .pipe(ts(config.ts))
    .pipe(gulp.dest('./spec'))
})

gulp.task('watch-ts', ['tsd'], function () {
  gulp.watch([paths.ts.src, paths.ts.tests], ['typescript', 'browserify'])
})

gulp.task('tsd', function (callback) {
  tsd({
    command: 'reinstall',
    config: './tsd.json'
  }, callback)
})

gulp.task('browserify', ['typescript'], function () {
  var bundler = browserify({
    entries: './dist/Viewer.js',
    debug: true,
    fullPaths: false,
    standalone: 'mapillaryjs'
  })

  return bundler
    .bundle()
    .pipe(source('Viewer.js'))
    .pipe(rename('bundle.js'))
    .pipe(gulp.dest('./dist/'))
})

gulp.task('documentation', ['typescript'], function () {
  gulp.src('./dist/Viewer.js')
    .pipe(documentation({format: 'html' }))
    .pipe(gulp.dest('html-documentation'))
})

gulp.task('default', ['serve', 'watch-ts', 'browserify'])
