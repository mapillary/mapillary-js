var fs = require('fs')

module.exports = function(config) {
  config.set({
    browserify: {
      debug: true,
      extensions: ['.ts'],
      plugin: [['tsify', JSON.parse(fs.readFileSync('./tsconfig.json', 'utf8')).compilerOptions]],
      transform: ['brfs'],
    },
    browsers: ['ChromeHeadless'],
    concurrency: 1,
    files: [
      {pattern: 'spec/**/*.spec.ts', type: "js"}
    ],
    frameworks: ['jasmine', 'browserify'],
    mime: {
      'text/x-typescript': ['ts','tsx']
    },
    preprocessors: {
      'spec/**/*.spec.ts': ['browserify'],
    }
  })
}
