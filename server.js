'use strict';

const express = require('express');
const path = require('path');

const PORT = 8000;

const logger = (req, _, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
};

const app = express();
app.use(logger);
app.use('/', express.static(path.join(__dirname, 'debug')));
app.use('/dist', express.static(path.join(__dirname, 'dist')));
app.get('/debug', (_, res) => { res.redirect('/'); });

app.listen(PORT, () => {
    const message =
        `mapillary-js debug server running at ` +
        `http://localhost:${PORT}`;
    console.log(message);
});
