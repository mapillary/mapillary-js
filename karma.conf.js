module.exports = function(config) {
  config.set({
    frameworks: ['jasmine'],
    browsers: ['Firefox'],
    files: [
      'build/bundle.js',
      'build/spec/**/*.spec.js'
    ],
    singleRun: true
  })
}
