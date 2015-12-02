var gulp = require('gulp')

var browserify = require('browserify')
var del = require('del')
var documentation = require('gulp-documentation')
var envify = require('envify/custom')
var exorcist = require('exorcist')
var fs = require('fs')
var KarmaServer = require('karma').Server
var source = require('vinyl-source-stream')
var serve = require('gulp-serve')
var standard = require('gulp-standard')
var shell = require('gulp-shell')
var ts = require('gulp-typescript')
var tsify = require('tsify')
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
  },
  sourceMaps: './build/bundle.js.map'
}

var config = {
  ts: JSON.parse(fs.readFileSync('./tsconfig.json', 'utf8')).compilerOptions
}

gulp.task('clean', function () {
  return del([
    'html-documentation',
    'build/**/*',
    'debug/**/*.js'
  ])
})

gulp.task('documentation', ['ts'], function () {
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

gulp.task('serve', ['ts'], serve('.'))

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
      process.exit(exitCode)
    }
  }, done).start()
})

gulp.task('test-watch', function (done) {
  new KarmaServer(extendKarmaConfig(__dirname + '/karma.conf.js', {
    singleRun: false
  }), done).start()
})

gulp.task('ts-lint', ['tsd'], function (cb) {
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

gulp.task('watch', [], function () {
  gulp.watch([paths.ts.src, paths.ts.tests], ['ts'])
})

gulp.task('default', ['serve', 'watch'])

// Helpers
function extendKarmaConfig (path, conf) {
  conf.configFile = path
  return conf
}

// TODO: Refine this task
gulp.task('ts', function () {
  browserify({
    entries: ['./src/Mapillary.ts'],
    debug: true,
    standalone: 'Mapillary'
  })
    .plugin(tsify, config.ts)
    .transform('brfs')
    .transform(envify({MAP_ENV: 'production'}))
    .bundle()
    .on('error', function (error) {
      console.error(error.toString())
    })
    .pipe(exorcist(paths.sourceMaps))
    .pipe(source('bundle.js'))
    .pipe(gulp.dest('./build'))
})
