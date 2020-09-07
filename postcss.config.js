module.exports = {
    plugins: [
        require('autoprefixer'),
        require('postcss-inline-svg')({
            paths: ['./styles'],
            encode: svg => Buffer.from(svg).toString('base64'),
            transform: encoded => `"data:image/svg+xml;base64,${encoded}"`
        }),
        require('cssnano')({
            preset: ['default', {
                normalizeWhitespace: false,
                svgo: {
                    plugins: [{
                        removeViewBox: false
                    }, {
                        removeDimensions: false
                    }],
                },
            }],
        }),

    ]
};