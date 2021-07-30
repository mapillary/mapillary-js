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

function makeFolder(container) {
  const folder = new Folder();
  container.appendChild(folder.container);
  return folder;
}

let viewer;
let settings;

export function init(opts) {
  const {accessToken, container} = opts;
  const imageId = '883055565889162';

  const viewerOptions = {
    accessToken,
    component: {cover: false},
    container,
  };
  viewer = new Viewer(viewerOptions);
  viewer.moveTo(imageId).catch((error) => console.warn(error));

  settings = makeFolder(container);

  const config = {
    // Clear
    clear: () => {
      viewer.setFilter([]);
    },

    // Equal
    fisheye: () => {
      viewer.setFilter(['==', 'cameraType', 'fisheye']);
    },
    perspective: () => {
      viewer.setFilter(['==', 'cameraType', 'perspective']);
    },
    spherical: () => {
      viewer.setFilter(['==', 'cameraType', 'spherical']);
    },
    sequence: () => {
      viewer.setFilter(['==', 'sequenceId', 'dTOS0pgRhYDsJ6RDLJrpqw']);
    },

    // Not equal
    notSpherical: () => {
      viewer.setFilter(['!=', 'cameraType', 'spherical']);
    },

    // Comparison
    quality: () => {
      viewer.setFilter(['>=', 'qualityScore', 0.8]);
    },
    capturedAfter: () => {
      viewer.setFilter(['>', 'capturedAt', new Date(2019, 1, 1).getTime()]);
    },
    capturedBefore: () => {
      viewer.setFilter(['<=', 'capturedAt', new Date(2015, 1, 1).getTime()]);
    },

    // Set membership
    fisheyeSpherical: () => {
      viewer.setFilter(['in', 'cameraType', 'fisheye', 'spherical']);
    },

    // Combination
    between: () => {
      viewer.setFilter([
        'all',
        ['>=', 'capturedAt', new Date(2016, 1, 1).getTime()],
        ['<=', 'capturedAt', new Date(2018, 1, 1).getTime()],
      ]);
    },
  };

  settings.add(new FunctionController(config, 'clear').setName('Clear'));

  {
    const folder = settings.addFolder({name: 'Equal', open: true});
    folder.add(new FunctionController(config, 'fisheye').setName('Fisheye'));
    folder.add(
      new FunctionController(config, 'perspective').setName('Perspective'),
    );
    folder.add(
      new FunctionController(config, 'spherical').setName('Spherical'),
    );
    folder.add(new FunctionController(config, 'sequence').setName('Sequence'));
  }

  {
    const folder = settings.addFolder({name: 'Not Equal', open: true});
    folder.add(
      new FunctionController(config, 'notSpherical').setName('Not Spherical'),
    );
  }

  {
    const folder = settings.addFolder({name: 'Comparison', open: true});
    folder.add(
      new FunctionController(config, 'quality').setName('High Quality'),
    );
    folder.add(
      new FunctionController(config, 'capturedAfter').setName('After 2018'),
    );
    folder.add(
      new FunctionController(config, 'capturedBefore').setName('Before 2015'),
    );
  }

  {
    const folder = settings.addFolder({name: 'Set Membership', open: true});
    folder.add(
      new FunctionController(config, 'fisheyeSpherical').setName(
        'Fisheye or Spherical',
      ),
    );
  }

  {
    const folder = settings.addFolder({name: 'Combination', open: true});
    folder.add(
      new FunctionController(config, 'between').setName('From 2016 to 2017'),
    );
  }
}

export function dispose() {
  if (viewer) {
    viewer.remove();
  }
}
