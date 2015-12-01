module.exports = function(config) {
  config.set({
    preprocessors: {
      'spec/**/*.ts': ['typescript']
    },
    frameworks: ['jasmine'],
    browsers: ['Firefox'],
    files: [
      'build/bundle.js',
      'spec/**/*.spec.ts'
    ],
    typescriptPreprocessor: {
    }
  })
}
