var gulp = require('gulp')

var browserify = require('browserify')
var del = require('del');
var documentation = require('gulp-documentation')
var karmaServer = require('karma').Server;
var source = require('vinyl-source-stream')
var serve = require('gulp-serve')
var standard = require('gulp-standard')
var shell = require('gulp-shell')
var ts = require('gulp-typescript')
var rename = require('gulp-rename')
var tsd = require('gulp-tsd')
var tslint = require('gulp-tslint')

var paths = {
  mapillaryjs: 'mapillaryjs',
  ts: {
    src: './src/**/*.ts',
    tests: './spec/**/*.ts',
    dest: 'dist',
    testDest: 'dist/spec'
  },
  js: {
    src: './src/**/*.js',
    tests: './spec/**/*.js'
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

gulp.task('browserify', ['typescript'], function () {
  var bundler = browserify({
    entries: './dist/Viewer.js',
    debug: true,
    fullPaths: false,
    standalone: 'Mapillary'
  })

  return bundler
    .bundle()
    .pipe(source('./dist/**/*.js'))
    .pipe(rename('bundle.js'))
    .pipe(gulp.dest('./dist/'))
})

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

gulp.task('documentation', ['browserify'], function () {
  gulp.src(path.js.src)
    .pipe(documentation({format: 'html' }))
    .pipe(gulp.dest('html-documentation'))
})

gulp.task('js-lint', function () {
  return gulp.src('./Gulpfile.js')
    .pipe(standard())
    .pipe(standard.reporter('default', {
      breakOnError: true
    }))
})

gulp.task('serve', ['browserify'], serve('.'))

gulp.task('test', function (done) {
  new karmaServer({
    configFile: __dirname + '/karma.conf.js',
    singleRun: true
  }, done).start();
})

gulp.task('test-watch', function (done) {
  new karmaServer({
    configFile: __dirname + '/karma.conf.js',
    singleRun: false
  }, done).start();
})

gulp.task('ts-lint', function () {
  return gulp.src(paths.ts.src)
    .pipe(tslint())
    .pipe(tslint.report('verbose'))
})

gulp.task('tsd', function (callback) {
  tsd({
    command: 'reinstall',
    config: './tsd.json'
  }, callback)
})

gulp.task('typescript', ['ts-lint', 'typescript-src', 'typescript-test'], function () {})

gulp.task('typescript-src', ['tsd'], function () {
  gulp.src(paths.ts.src)
    .pipe(ts(config.ts))
    .pipe(gulp.dest(paths.ts.dest))
})

gulp.task('typescript-test', ['tsd'], function () {
  gulp.src(paths.ts.tests)
    .pipe(ts(config.ts))
    .pipe(gulp.dest(paths.ts.testDest))
})

gulp.task('watch', ['browserify'], function () {
    gulp.watch([paths.ts.src, paths.ts.tests], ['browserify'])
})

gulp.task('default', ['serve', 'watch'])
