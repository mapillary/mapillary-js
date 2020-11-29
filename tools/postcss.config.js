//"cat styles/*.css | postcss --use autoprefixer --use cssnano -o dist/mapillary.min.css"

module.exports = (ctx) => ({
    parser: ctx.parser ? 'sugarss' : false,
    // map: ctx.env === 'development' ? ctx.map : false,
    map: true,
    plugins: {
      'postcss-import': {},
      'autoprefixer': {
          browsers: [
              "last 2 versions",
              "safari 7",
              "ie 11"
            ]
        },
        // 'postcss-assets': {
        //     loadPaths: ['./*.svg']
        // },
        'postcss-inline-svg' : {},
        'postcss-svg': {},
        cssnano: ctx.env === 'production' ? {} : false,
    }
  })
