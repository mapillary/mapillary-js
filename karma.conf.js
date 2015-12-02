var envify = require('envify');
var fs = require('fs')

module.exports = function(config) {
  config.set({
    preprocessors: {
      'spec/Setup.ts': ['browserify'],
      'spec/**/*.spec.ts': ['browserify'],
      'spec/Teardown.ts': ['browserify']
    },
    frameworks: ['jasmine', 'browserify'],
    browsers: ['Firefox'],
    files: [
      'build/bundle.js',
      'spec/Setup.ts',
      'spec/**/**.spec.ts',
      'spec/Teardown.ts'
    ],
    browserify: {
      debug: true,
      transform: ['brfs', 'envify'],
      plugin: [['tsify', JSON.parse(fs.readFileSync('./tsconfig.json', 'utf8')).compilerOptions]],
      extensions: ['.ts']
    }
  })
}
