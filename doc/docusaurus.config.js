/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const path = require('path');
const docsConfig = require('./docusaurus.docs.config.js');

const config = {...docsConfig};
config.plugins = config.plugins.slice();
config.plugins.push(
  [
    'docusaurus-plugin-typedoc',
    {
      sidebar: {sidebarFile: null},
    },
  ],
  [
    path.resolve(__dirname, 'plugins/plugin-overwrite-slug'),
    {
      basePath: 'api',
      files: [
        {
          path: 'index.md',
          slug: '/',
        },
      ],
    },
  ],
  [
    '@docusaurus/plugin-content-docs',
    {
      id: 'api',
      path: 'api',
      routeBasePath: 'api',
      sidebarPath: require.resolve('./sidebars/api.sidebars.js'),
      editUrl: 'https://github.com/mapillary/mapillary-js/edit/main/doc',
    },
  ],
);

/** @type {import('@docusaurus/types').DocusaurusConfig} */
module.exports = config;
