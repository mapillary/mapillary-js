/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

/** @type {import('@docusaurus/types').DocusaurusConfig} */
module.exports = {
  title: 'MapillaryJS',
  tagline: 'Interactive, extendable street imagery visualization platform',
  url: 'https://mapillary.github.io',
  baseUrl: '/mapillary-js/',
  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.png',
  organizationName: 'mapillary',
  projectName: 'mapillary-js',
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          sidebarPath: require.resolve('./sidebars/docs.sidebars.js'),
          editUrl: 'https://github.com/mapillary/mapillary-js/edit/main/doc',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      },
    ],
  ],
  plugins: [
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'examples',
        path: 'examples',
        routeBasePath: 'examples',
        sidebarPath: require.resolve('./sidebars/examples.sidebars.js'),
        editUrl: 'https://github.com/mapillary/mapillary-js/edit/main/doc',
      },
    ],
  ],
  themes: ['@docusaurus/theme-live-codeblock'],
  themeConfig: {
    algolia: {
      apiKey: 'babb57526d420b45135a3724e9cabb84',
      indexName: 'mapillary',
    },
    navbar: {
      title: 'MapillaryJS',
      logo: {
        alt: 'MapillaryJS',
        src: 'img/logo_green.svg',
      },
      items: [
        {
          to: 'docs',
          activeBasePath: 'docs',
          label: 'Docs',
          position: 'right',
        },
        {
          to: 'api',
          activeBasePath: 'api',
          label: 'API',
          position: 'right',
        },
        {
          to: 'examples',
          activeBasePath: 'examples',
          label: 'Examples',
          position: 'right',
        },
        {
          href: 'https://github.com/mapillary/mapillary-js',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Getting Started',
              to: 'docs',
            },
            {
              label: 'Guides',
              to: 'docs/guides',
            },
            {
              label: 'Extension',
              to: 'docs/extension/extend',
            },
            {
              label: 'API Reference',
              to: 'api',
            },
            {
              label: 'Examples',
              to: 'examples',
            },
            {
              label: 'Theory',
              to: 'docs/theory/theory',
            },
            {
              label: 'Migration',
              to: 'docs/migration/v4',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/mapillary/mapillary-js',
            },
          ],
        },
        {
          title: 'Legal',
          items: [
            {
              label: 'Privacy',
              href: 'https://opensource.facebook.com/legal/privacy/',
            },
            {
              label: 'Terms',
              href: 'https://opensource.facebook.com/legal/terms/',
            },
            {
              label: 'Data Policy',
              href: 'https://opensource.facebook.com/legal/data-policy/',
            },
            {
              label: 'Cookie Policy',
              href: 'https://opensource.facebook.com/legal/cookie-policy/',
            },
          ],
        },
      ],
      logo: {
        alt: 'Facebook Open Source Logo',
        src: 'img/oss_logo.png',
        href: 'https://opensource.facebook.com',
      },
      copyright: `Copyright © ${new Date().getFullYear()} Facebook, Inc. Built with Docusaurus.`,
    },
  },
};
