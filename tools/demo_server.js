/* eslint-env node */
const express = require('express');
const { resolve } = require('path');
const port = process.env.PORT || 5000;

const app = express();
app.use(
    express.static(
        resolve(__dirname, '../demo')
    )
);

app.listen(port, '0.0.0.0', function() {
  /* eslint-disable no-console */
  console.log('Starting lib server on http://0.0.0.0:', port);
  /* eslint-enable no-console */
});


app.use(express.static('public'))
