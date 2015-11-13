module.exports = function(config) {
  config.set({
    frameworks: ['jasmine'],
    browsers: ['Chrome'],
    files: [
      'build/bundle.js',
      'build/spec/**/*.spec.js'
    ],
    singleRun: true
  })
}
