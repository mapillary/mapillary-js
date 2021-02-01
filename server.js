'use strict';

import express from 'express';
import { join } from 'path';

const PORT = 8000;

const pathname = dirname => {
    const path = join(import.meta.url, `../${dirname}`);
    return new URL(path).pathname;
}

const logger = (req, res, next) => {
    const clearColor = '\x1b[0m';
    res.on('finish', () => {
        const color = res.statusCode === 200 ?
            clearColor : '\x1b[31m';
        const format = `${color}%s${clearColor}`;
        const message = `[${new Date().toISOString()}] ${req.method} ` +
            `${req.path} ${res.statusCode}`;
        console.log(format, message);
    });
    next();
};

const app = express();
app.use(logger);
app.use('/', express.static(pathname('debug')));
app.use('/dist', express.static(pathname('dist')));
app.get('/debug', (_, res) => { res.redirect('/'); });

app.listen(PORT, () => {
    const message =
        `mapillary-js debug server running at ` +
        `http://localhost:${PORT}`;
    console.log(message);
});
