var fs = require('fs')

module.exports = function(config) {
  config.set({
    preprocessors: {
      'spec/**/*.spec.ts': ['browserify']
    },
    frameworks: ['jasmine', 'browserify'],
    browsers: ['Firefox'],
    files: [
      'build/bundle.js',
      'spec/**/**.spec.ts'
    ],
    browserify: {
      debug: true,
      plugin: [['tsify', JSON.parse(fs.readFileSync('./tsconfig.json', 'utf8')).compilerOptions]],
      extensions: ['.ts']
    }
  })
}
