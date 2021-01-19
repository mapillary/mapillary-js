'use strict';

const autoprefixer = require('autoprefixer');
const express = require('express');
const brfs = require('brfs');
const browserify = require('browserify-middleware');
const fs = require('fs')
const path = require('path');
const postcss = require('postcss-middleware');
const tsify = require('tsify');
const inline = require('postcss-inline-svg')({
    paths: ['./styles'],
    encode: svg => Buffer.from(svg).toString('base64'),
    transform: encoded => `"data:image/svg+xml;base64,${encoded}"`
});
const cssnano = require('cssnano')({
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

const app = express();

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

const port = 8000;
app.listen(port, () => {
    const message =
        `mapillary-js debug server running at http://localhost:${port}`;
    console.log(message);
});
