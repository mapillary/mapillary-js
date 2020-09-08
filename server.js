'use strict';

var autoprefixer = require('autoprefixer');
var express = require('express');
var brfs = require('brfs');
var browserify = require('browserify-middleware');
var fs = require('fs')
var path = require('path');
var postcss = require('postcss-middleware');
var tsify = require('tsify');
var inline = require('postcss-inline-svg')({
    paths: ['./styles'],
    encode: svg => Buffer.from(svg).toString('base64'),
    transform: encoded => `"data:image/svg+xml;base64,${encoded}"`
});
var cssnano = require('cssnano')({
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
});

var app = express();

app.get('/dist/mapillary.js', browserify('./src/Mapillary.ts', {
    cache: 'dynamic',
    debug: true,
    plugins: [{
        plugin: 'tsify',
        options: JSON.parse(fs.readFileSync('./tsconfig.json', 'utf8')).compilerOptions,
    }],
    precompile: true,
    standalone: 'Mapillary',
    transform: ['brfs'],
}));

app.get('/dist/mapillary.min.css', postcss({
	src: () => { return path.join(__dirname, 'styles', '*.css'); },
	plugins: [
        autoprefixer,
        inline,
        cssnano,
    ]
}));

app.get('/debug', (_, res) => { res.redirect('/'); });

app.use(express.static(path.join(__dirname, 'debug')));
app.use('/dist', express.static(path.join(__dirname, 'dist')));

app.listen(3000, () => {
    console.log('mapillary-js debug server running at http://localhost:3000');
});
