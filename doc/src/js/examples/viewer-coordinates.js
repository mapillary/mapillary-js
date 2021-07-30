/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {Viewer} from '../../mapillary-js/dist/mapillary.module';

import {Folder} from '../options/Folder';
import {FunctionController} from '../options/FunctionController';

function modulo(n, m) {
  return ((n % m) + m) % m;
}

function makeFolder(container) {
  const folder = new Folder();
  container.appendChild(folder.container);
  return folder;
}

let viewer;
let settings;

export function init(opts) {
  const {accessToken, container} = opts;
  const imageId = '812898706331239';

  const viewerOptions = {
    accessToken,
    component: {cover: false},
    container,
  };
  viewer = new Viewer(viewerOptions);
  viewer.moveTo(imageId).catch((error) => console.warn(error));

  viewer.on('dblclick', (event) => {
    if (!event.basicPoint) {
      return;
    }
    viewer.setCenter(event.basicPoint);
    viewer.setZoom(3);
  });
  viewer.on('contextmenu', (event) => {
    if (!event.basicPoint) {
      return;
    }
    viewer.setCenter(event.basicPoint);
    viewer.setZoom(0);
  });

  settings = makeFolder(container);

  const config = {
    reset: () => {
      viewer.setCenter([0.5, 0.5]);
      viewer.setZoom(0);
    },
    panLeft: async () => {
      const image = await viewer.getImage();
      const [centerX, centerY] = await viewer.getCenter();
      const pannedX =
        image.cameraType === 'spherical'
          ? modulo(centerX - 0.1, 1)
          : Math.max(0, centerX - 0.1);
      viewer.setCenter([pannedX, centerY]);
    },
    panRight: async () => {
      const image = await viewer.getImage();
      const [centerX, centerY] = await viewer.getCenter();
      const pannedX =
        image.cameraType === 'spherical'
          ? modulo(centerX + 0.1, 1)
          : Math.min(1, centerX + 0.1);
      viewer.setCenter([pannedX, centerY]);
    },
    tiltDown: async () => {
      const [centerX, centerY] = await viewer.getCenter();
      const tiltedY = Math.min(1, centerY + 0.1);
      viewer.setCenter([centerX, tiltedY]);
    },
    tiltUp: async () => {
      const [centerX, centerY] = await viewer.getCenter();
      const tiltedY = Math.max(0, centerY - 0.1);
      viewer.setCenter([centerX, tiltedY]);
    },
    zoomIn: async () => {
      const zoom = await viewer.getZoom();
      viewer.setZoom(zoom + 0.25);
    },
    zoomOut: async () => {
      const zoom = await viewer.getZoom();
      viewer.setZoom(zoom - 0.25);
    },
    decreaseFov: async () => {
      const fov = await viewer.getFieldOfView();
      viewer.setFieldOfView(0.9 * fov);
    },
    increaseFov: async () => {
      const fov = await viewer.getFieldOfView();
      viewer.setFieldOfView(fov / 0.9);
    },
  };

  settings.add(new FunctionController(config, 'reset').setName('Reset'));
  settings.add(new FunctionController(config, 'panLeft').setName('Pan Left'));
  settings.add(new FunctionController(config, 'panRight').setName('Pan Right'));
  settings.add(new FunctionController(config, 'tiltDown').setName('Tilt Down'));
  settings.add(new FunctionController(config, 'tiltUp').setName('Tilt Up'));
  settings.add(new FunctionController(config, 'zoomIn').setName('Zoom In'));
  settings.add(new FunctionController(config, 'zoomOut').setName('Zoom Out'));
  settings.add(
    new FunctionController(config, 'decreaseFov').setName(
      'Decrease Field of View',
    ),
  );
  settings.add(
    new FunctionController(config, 'increaseFov').setName(
      'Increase Field of View',
    ),
  );
}

export function dispose() {
  if (viewer) {
    viewer.remove();
  }
}
