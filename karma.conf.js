var fs = require('fs')

module.exports = function(config) {
  config.set({
    browserify: {
      debug: true,
      transform: ['brfs'],
      plugin: [['tsify', JSON.parse(fs.readFileSync('./tsconfig.json', 'utf8')).compilerOptions]],
      extensions: ['.ts']
    },
    browsers: ['Firefox'],
    files: [
      'build/bundle.js',
      'spec/**/**.spec.ts'
    ],
    frameworks: ['jasmine', 'browserify'],
    preprocessors: {
      'spec/**/*.spec.ts': ['browserify'],
    }
  })
}
