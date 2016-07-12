'use strict';

var express = require('express');
var brfs = require('brfs');
var browserify = require('browserify-middleware');
var path = require('path');
var tsify = require('tsify');

var app = express();

app.get('/build/bundle.js', browserify('./src/Mapillary.ts', {
    cache: 'dynamic',
    debug: true,
    plugins: [{ plugin: 'tsify', options: { noImplicitAny: true, target: "ES5", module: "commonjs" }}],
    precompile: true,
    standalone: 'Mapillary',
    transform: ['brfs'],
}));

app.get('/debug', function(req, res) {
    res.redirect('/');
});

app.use(express.static(path.join(__dirname, 'debug')));
app.use('/dist', express.static(path.join(__dirname, 'dist')));
app.use('/build', express.static(path.join(__dirname, 'build')));

app.listen(3000, function () {
    console.log('mapillary-js debug server running at http://localhost:3000');
});
