var gulp = require('gulp')

var browserify = require('browserify')
var del = require('del')
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
  sourceMaps: './build/bundle.js.map',
  sourceMapsDist: './dist/mapillary-js.map'
}

var config = {
  browserify: {
    entries: ['./src/Mapillary.ts'],
    debug: true,
    standalone: 'Mapillary',
    fullPaths: true
  },
  uglifyify: {
    global: true,
    ignore: ['**/node_modules/rest/*',
             '**/node_modules/rest/**/*',
             '**/node_modules/when/*',
             '**/node_modules/when/**/*'
            ]
  },
  ts: JSON.parse(fs.readFileSync('./tsconfig.json', 'utf8')).compilerOptions,
  typedoc: {
    includes: ['./src/viewer/Viewer.ts',
               './src/graph/Graph.ts'
              ],
    options: {
      target: 'ES5',
      module: 'commonjs',
      theme: 'minimal',
      mode: 'file',
      excludeExternals: '',
      out: './docs-out',
      name: '"mapillary-js 0.0.1"',
      includes: 'docs/includes',
      media: 'docs/media'
    }
  }
}

gulp.task('clean', function () {
  return del([
    'docs/ts/**/*',
    'build/**/*',
    'debug/**/*.js'
  ])
})

var parsedOptions = []
for (var key in config.typedoc.options) {
  parsedOptions.push('--' + key + ' ' + config.typedoc.options[key])
}

gulp.task('documentation', shell.task('./node_modules/typedoc/bin/typedoc ' +
                                      parsedOptions.join(' ') +
                                      ' ' +
                                      config.typedoc.includes.join(' ')
                                     ))

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
  var config
  if (argv.grep) {
    config = extendKarmaConfig(__dirname + '/karma.conf.js', {
      client: {
        args: ['--grep', argv.grep]
      },
      singleRun: false
    })
  } else {
    config = extendKarmaConfig(__dirname + '/karma.conf.js', {
      singleRun: false
    })
  }

  new KarmaServer(config, function (exitCode) {
    if (exitCode) {
      process.exit(exitCode)
    }
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

gulp.task('watch', [], function () {
  gulp.watch([paths.ts.src, paths.ts.tests], ['ts', 'documentation'])
})

gulp.task('default', ['serve', 'watch'])

// Helpers
function extendKarmaConfig (path, conf) {
  conf.configFile = path
  return conf
}

gulp.task('prepublish', ['ts-lint'], function () {
  browserify(config.browserify)
    .plugin(tsify, config.ts)
    .transform('brfs')
    .transform('envify')
    .transform(config.uglifyify, 'uglifyify')
    .bundle()
    .on('error', function (error) {
      console.error(error.toString())
    })
    .pipe(exorcist(paths.sourceMapsDist))
    .pipe(source('mapillary-js.min.js'))
    .pipe(gulp.dest('./dist'))
})

// TODO: Refine this task
gulp.task('ts', ['ts-lint'], function () {
  browserify(config.browserify)
    .plugin(tsify, config.ts)
    .transform('brfs')
    .transform('envify')
    .transform(config.uglifyify, 'uglifyify')
    .bundle()
    .on('error', function (error) {
      console.error(error.toString())
    })
    .pipe(exorcist(paths.sourceMaps))
    .pipe(source('bundle.js'))
    .pipe(gulp.dest('./build'))
})
