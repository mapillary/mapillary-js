/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

module.exports = {
  docs: {
    'Getting Started': ['intro/start', 'intro/try', 'intro/glossary'],
    'Main Concepts': [
      'main/guide',
      'main/init',
      {
        type: 'doc',
        id: 'main/control',
        label: 'Control',
      },
      'main/event',
      {
        type: 'doc',
        id: 'main/component',
        label: 'Components',
      },
    ],
    Extension: [
      {
        type: 'doc',
        id: 'extension/extend',
        label: 'Extend',
      },
      {
        type: 'category',
        label: 'Data Provider',
        collapsed: false,
        items: [
          {
            type: 'doc',
            id: 'extension/procedural-data-provider',
            label: 'Procedural',
          },
          {
            type: 'doc',
            id: 'extension/geometry-provider',
            label: 'Geometry',
          },
        ],
      },
      {
        type: 'category',
        label: 'Custom Render',
        collapsed: false,
        items: [
          {
            type: 'doc',
            id: 'extension/webgl-custom-renderer',
            label: 'WebGL',
          },
          {
            type: 'doc',
            id: 'extension/three-custom-renderer',
            label: 'Three.js',
          },
          'extension/animation',
        ],
      },
      {
        type: 'category',
        label: 'Camera Controls',
        collapsed: false,
        items: [
          {
            type: 'doc',
            id: 'extension/fly-controls',
            label: 'Fly Controls',
          },
        ],
      },
    ],
    Theory: [
      'theory/theory',
      {
        type: 'doc',
        id: 'theory/coordinates',
        label: 'Coordinates',
      },
      {
        type: 'doc',
        id: 'theory/navigation-graph',
        label: 'Navigation',
      },
      {
        type: 'doc',
        id: 'theory/polygon-triangulation',
        label: 'Triangulation',
      },
    ],
    Migration: ['migration/v4', 'migration/v3', 'migration/v2'],
  },
};
