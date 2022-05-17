/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {
  CameraControls,
  PointVisualizationMode,
  Viewer,
} from '../../mapillary-js/dist/mapillary.module';

import {ProceduralDataProvider} from '../utils/ProceduralDataProvider';

let viewer;

export function init(opts) {
  const {container} = opts;

  const imageId = 'image|fisheye|0';
  const dataProvider = new ProceduralDataProvider({});
  const options = {
    dataProvider,
    cameraControls: CameraControls.Earth,
    component: {
      cover: false,
      spatial: {
        cameraSize: 0.5,
        cellGridDepth: 3,
        cellsVisible: true,
        pointVisualizationMode: PointVisualizationMode.Hidden,
      },
    },
    container,
    imageTiling: false,
  };
  viewer = new Viewer(options);
  viewer.moveTo(imageId).catch((error) => console.error(error));
}

export function dispose() {
  if (viewer) {
    viewer.remove();
  }
}
