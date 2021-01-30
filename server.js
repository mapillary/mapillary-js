'use strict';

const autoprefixer = require('autoprefixer');
const browserify = require('browserify-middleware');
const express = require('express');
const fs = require('fs')
const path = require('path');
const postcss = require('postcss');
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
}));

app.get('/dist/mapillary.min.css', (_, res) => {
    const styles = path.join(__dirname, 'styles');
    const css = fs.readdirSync(styles)
        .map(filename => path.join(styles, filename))
        .filter(
            filepath => {
                const isFile = fs.statSync(filepath).isFile();
                if (!isFile) { return false; }
                const isCss = path.extname(filepath) === '.css';
                if (!isCss) { return false; }
                return true;
            })
        .map(
            filepath => {
                return fs.readFileSync(filepath, { encoding: 'utf8' });
            })
        .reduce((acc, curr) => acc + curr, '');

    const from = path.join(__dirname, 'styles', 'mapillary-js.css');
    const map = false;
    const processor = postcss([
        autoprefixer,
        inline,
        cssnano,
    ]);
    processor.process(css, { from, map }).then(result => {
        res.writeHead(200, {
            'Content-Type': 'text/css'
        });
        res.end(result.css);
    });
});

app.get('/debug', (_, res) => { res.redirect('/'); });
app.use(express.static(path.join(__dirname, 'debug')));
app.use('/dist', express.static(path.join(__dirname, 'dist')));

const port = 8000;
app.listen(port, () => {
    const message =
        `mapillary-js debug server running at http://localhost:${port}`;
    console.log(message);
});
