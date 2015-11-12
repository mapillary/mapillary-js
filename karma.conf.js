module.exports = function(config) {
  config.set({
    frameworks: ['jasmine'],
    browsers: ['Chrome'],
    files: [
      'dist/bundle.js',
      'dist/spec/**/*.spec.js'
    ],
    singleRun: true
  })
}
