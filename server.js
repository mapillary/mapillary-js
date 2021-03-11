'use strict';

import express from 'express';
import { join } from 'path';

const PORT = 8000;

const pathname = dirname => {
    const path = join(import.meta.url, `../${dirname}`);
    return new URL(path).pathname;
}

const logger = (req, _, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
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
