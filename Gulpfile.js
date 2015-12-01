var gulp = require('gulp')

var browserify = require('browserify')
var del = require('del')
var documentation = require('gulp-documentation')
var fs = require('fs')
var KarmaServer = require('karma').Server
var source = require('vinyl-source-stream')
var serve = require('gulp-serve')
var standard = require('gulp-standard')
var shell = require('gulp-shell')
var ts = require('gulp-typescript')
var rename = require('gulp-rename')
var tslint = require('gulp-tslint')
var argv = require('yargs').argv

var paths = {
  mapillaryjs: 'mapillaryjs',
  build: './build',
  ts: {
    src: './src/**/*.ts',
    tests: './spec/**/*.ts',
    dest: 'build',
    testDest: 'build/spec'
  },
  js: {
    src: './build/**/*.js',
    tests: './spec/**/*.js'
  }
}

var config = {
  ts: JSON.parse(fs.readFileSync('./tsconfig.json', 'utf8')).compilerOptions
}

gulp.task('browserify', ['typescript'], function () {
  var bundler = browserify({
    entries: ['./build/Mapillary.js'],
    debug: true,
    fullPaths: false,
    standalone: 'Mapillary'
  })

  bundler.transform('brfs')

  bundler
    .bundle()
    .pipe(source('./build/Mapillary.js'))
    .pipe(rename('bundle.js'))
    .pipe(gulp.dest('./build/'))
})

gulp.task('clean', function () {
  return del([
    'html-documentation',
    'build/**/*',
    'debug/**/*.js'
  ])
})

gulp.task('documentation', ['browserify'], function () {
  gulp.src(['./build/Viewer.js', './build/API.js'])
  .pipe(documentation({format: 'html'}))
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
  var config
  if (argv.grep) {
    config = extendKarmaConfig(__dirname + '/karma.conf.js', {
      client: {
        args: ['--grep', argv.grep]
      },
      singleRun: true
    })
  } else {
    config = extendKarmaConfig(__dirname + '/karma.conf.js', {
      singleRun: true
    })
  }

  new KarmaServer(config, function (exitCode) {
    if (exitCode) {
      console.error(exitCode)
    }
  }, done).start()
})

gulp.task('test-watch', function (done) {
  new KarmaServer({
    configFile: __dirname + '/karma.conf.js',
    singleRun: false
  }, done).start()
})

gulp.task('ts-lint', function (cb) {
  var stream = gulp.src(paths.ts.src)
    .pipe(tslint())
    .pipe(tslint.report('verbose'))
  return stream
})

gulp.task('tsd', shell.task('./node_modules/tsd/build/cli.js install'))

gulp.task('typescript', ['ts-lint', 'typescript-src', 'typescript-test'], function (cb) { cb() })

gulp.task('typescript-src', function () {
  var stream = gulp.src(paths.ts.src)
    .pipe(ts(config.ts))
    .pipe(gulp.dest(paths.ts.dest))
  return stream
})

gulp.task('typescript-test', function () {
  var stream = gulp.src(paths.ts.tests)
    .pipe(ts(config.ts))
    .pipe(gulp.dest(paths.ts.testDest))
  return stream
})

gulp.task('watch', [], function () {
  gulp.watch([paths.ts.src, paths.ts.tests], ['browserify'])
})

gulp.task('default', ['serve', 'watch'])

// Helpers
function extendKarmaConfig (path, conf) {
  conf.configFile = path
  return conf
}
