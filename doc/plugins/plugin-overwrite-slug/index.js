/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const fs = require('fs');
const path = require('path');

const DEFAULT_OPTIONS = {};

module.exports = (context, options) => {
  const opts = {...DEFAULT_OPTIONS, ...options};

  const {basePath, files} = opts;

  files.forEach((file) => {
    const name = path.join(process.cwd(), basePath, file.path);
    const content = fs.readFileSync(name, 'utf-8');
    const lines = content.split('\n');
    const overwritten = lines.reduce((acc, line) => {
      if (!line.startsWith('slug: ')) {
        return acc;
      }
      return acc.replace(line, `slug: '${file.slug}'`);
    }, content);
    fs.writeFileSync(name, overwritten);
  });

  return {
    name: 'plugin-overwrite-slug',
  };
};
