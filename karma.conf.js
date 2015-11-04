module.exports = function(config) {
  config.set({
    frameworks: ['jasmine'],

    browsers: ['Chrome'],

    files: [
      'dist/bundle.js',
      'spec/Viewer.spec.js'
    ],
    singleRun: true
  })
}