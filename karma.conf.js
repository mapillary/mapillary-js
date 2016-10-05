var fs = require('fs')

module.exports = function(config) {
  config.set({
    browserify: {
      debug: true,
      extensions: ['.ts'],
      plugin: [['tsify', JSON.parse(fs.readFileSync('./tsconfig.json', 'utf8')).compilerOptions]],
      transform: ['brfs'],
    },
    browsers: ['Firefox'],
    concurrency: 1,
    files: [
      'spec/**/*.spec.ts'
    ],
    frameworks: ['jasmine', 'browserify'],
    preprocessors: {
      'spec/**/*.spec.ts': ['browserify'],
    }
  })
}
