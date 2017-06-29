'use strict';

var autoprefixer = require('autoprefixer');
var cssnano = require('cssnano');
var express = require('express');
var brfs = require('brfs');
var browserify = require('browserify-middleware');
var fs = require('fs')
var path = require('path');
var postcss = require('postcss-middleware');
var tsify = require('tsify');

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
	src: function(req) { return path.join(__dirname, 'styles', '*.css'); },
	plugins: [
        autoprefixer(),
        cssnano({ zindex: false })
    ]
}));

app.get('/debug', function(req, res) {
    res.redirect('/');
});

app.use(express.static(path.join(__dirname, 'debug')));
app.use('/dist', express.static(path.join(__dirname, 'dist')));

app.listen(3000, function () {
    console.log('mapillary-js debug server running at http://localhost:3000');
});
