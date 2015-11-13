module.exports = function(config) {
  config.set({
    frameworks: ['jasmine'],
    browsers: ['Chrome'],
    client: {
      args: ['--grep', '<pattern>']
    },
    files: [
      'build/bundle.js',
      'build/spec/**/*.spec.js'
    ],
    singleRun: true
  })
}
