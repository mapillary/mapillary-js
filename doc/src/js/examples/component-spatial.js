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
  CameraVisualizationMode,
  OriginalPositionMode,
  Viewer,
} from '../../../mods/mapillary-js/dist/mapillary.module';

import {Folder} from '../options/Folder';
import {BooleanController} from '../options/BooleanController';
import {NumberController} from '../options/NumberController';
import {OptionController} from '../options/OptionController';

function makeFolder(container) {
  const folder = new Folder({open: true});
  container.appendChild(folder.container);
  return folder;
}

let viewer;

export function init(opts) {
  const {accessToken, container} = opts;
  const imageId = '298096478644828';

  const componentOptions = {
    cover: false,
    spatial: {
      cameraSize: 0.2,
      cameraVisualizationMode: CameraVisualizationMode.Homogeneous,
      cellGridDepth: 1,
      originalPositionMode: OriginalPositionMode.Hidden,
      pointSize: 0.1,
      pointsVisible: true,
      cellsVisible: false,
    },
  };
  const viewerOptions = {
    accessToken,
    component: componentOptions,
    container,
  };

  viewer = new Viewer(viewerOptions);
  viewer.moveTo(imageId).catch((error) => console.warn(error));

  const spatialComponent = viewer.getComponent('spatial');
  const settings = makeFolder(container);
  const config = {...componentOptions.spatial};
  config.cameraVisualizationMode =
    CameraVisualizationMode[config.cameraVisualizationMode];
  config.originalPositionMode =
    OriginalPositionMode[config.originalPositionMode];
  config.cameraControls = CameraControls.Street;
  config.image = true;

  const configure = (name, value) => {
    const newConfig = {};
    newConfig[name] = value;
    spatialComponent.configure(newConfig);
  };

  const handleConfig = (name) => (value) => configure(name, value);

  {
    const folder = settings.addFolder({
      name: 'Misc',
      open: true,
    });
    folder.add(
      new OptionController(config, 'cameraControls', [
        CameraControls[CameraControls.Street],
        CameraControls[CameraControls.Earth],
      ])
        .setName('Controls')
        .onChange((controls) =>
          viewer.setCameraControls(CameraControls[controls]),
        ),
    );
    folder.add(
      new OptionController(config, 'originalPositionMode', [
        OriginalPositionMode[OriginalPositionMode.Hidden],
        OriginalPositionMode[OriginalPositionMode.Flat],
        OriginalPositionMode[OriginalPositionMode.Altitude],
      ])
        .setName('GPS Positions')
        .onChange((mode) =>
          configure('originalPositionMode', OriginalPositionMode[mode]),
        ),
    );
    folder.add(
      new BooleanController(config, 'image')
        .setName('Image')
        .onChange((value) => {
          if (value) {
            viewer.activateComponent('image');
          } else {
            viewer.deactivateComponent('image');
          }
        }),
    );
  }

  {
    const folder = settings.addFolder({
      name: 'Points',
      open: true,
    });
    folder.add(
      new BooleanController(config, 'pointsVisible')
        .setName('Visible')
        .onChange(handleConfig('pointsVisible')),
    );
    folder.add(
      new NumberController(config, 'pointSize', {min: 0, max: 1})
        .setName('Size')
        .onChange(handleConfig('pointSize')),
    );
  }

  {
    const folder = settings.addFolder({
      name: 'Cameras',
      open: true,
    });
    folder.add(
      new OptionController(config, 'cameraVisualizationMode', [
        CameraVisualizationMode[CameraVisualizationMode.Homogeneous],
        CameraVisualizationMode[CameraVisualizationMode.Cluster],
        CameraVisualizationMode[CameraVisualizationMode.ConnectedComponent],
        CameraVisualizationMode[CameraVisualizationMode.Hidden],
        CameraVisualizationMode[CameraVisualizationMode.Sequence],
      ])
        .setName('Mode')
        .onChange((mode) =>
          configure('cameraVisualizationMode', CameraVisualizationMode[mode]),
        ),
    );
    folder.add(
      new NumberController(config, 'cameraSize', {min: 0, max: 1})
        .setName('Size')
        .onChange(handleConfig('cameraSize')),
    );
  }

  {
    const folder = settings.addFolder({
      name: 'S2 Geometry',
      open: true,
    });
    folder.add(
      new BooleanController(config, 'cellsVisible')
        .setName('Cells')
        .onChange(handleConfig('cellsVisible')),
    );
    folder.add(
      new OptionController(config, 'cellGridDepth', [1, 2, 3])
        .setName('Grid Depth')
        .onChange(handleConfig('cellGridDepth')),
    );
  }
}

export function dispose() {
  if (viewer) {
    viewer.remove();
  }
}
