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
  RenderMode,
  TransitionMode,
  Viewer,
} from '../../../mods/mapillary-js/dist/mapillary.module';

import {Folder} from '../options/Folder';
import {BooleanController} from '../options/BooleanController';
import {OptionController} from '../options/OptionController';

let viewer;
let settings;

function makeFolder(container) {
  const folder = new Folder();
  folder.container.style.position = 'absolute';
  folder.container.style.top = '0px';
  folder.container.style.right = '12px';
  container.appendChild(folder.container);
  return folder;
}

function toggleComponent(value, name) {
  if (value) {
    viewer.activateComponent(name);
  } else {
    viewer.deactivateComponent(name);
  }
}

export function init(opts) {
  const {accessToken, container} = opts;
  const imageId = 'kcXKtxR_S3ISk0zNR_TDnA';

  viewer = new Viewer({
    apiClient: accessToken,
    component: {cover: false},
    container,
  });
  viewer.moveTo(imageId).catch((error) => console.warn(error));

  settings = makeFolder(container);

  {
    // Component appearance
    const config = {
      bearing: true,
      cover: false,
      direction: true,
      sequence: true,
      zoom: true,
    };

    const folder = settings.addFolder({name: 'Component', open: true});
    folder.add(
      new BooleanController(config, 'cover')
        .setName('Cover')
        .listen()
        .onChange((value) => {
          if (value) {
            viewer.activateCover();
            settings.container.style.zIndex = 100;
          } else {
            viewer.deactivateCover();
            settings.container.style.zIndex = null;
          }
        }),
    );
    viewer.on('navigable', (event) => {
      if (event.navigable) {
        config.cover = false;
      }
    });

    folder.add(
      new BooleanController(config, 'bearing')
        .setName('Bearing')
        .onChange((value) => toggleComponent(value, 'bearing')),
    );
    folder.add(
      new BooleanController(config, 'direction')
        .setName('Direction')
        .onChange((value) => toggleComponent(value, 'direction')),
    );
    folder.add(
      new BooleanController(config, 'sequence')
        .setName('Sequence')
        .onChange((value) => toggleComponent(value, 'sequence')),
    );
    folder.add(
      new BooleanController(config, 'zoom')
        .setName('Zoom')
        .onChange((value) => toggleComponent(value, 'zoom')),
    );
  }

  {
    // Viewer appearance and behavior
    const config = {
      cameraControls: CameraControls[CameraControls.Street],
      combinedPanning: true,
      renderMode: RenderMode[RenderMode.Fill],
      transitionMode: TransitionMode[TransitionMode.Default],
    };

    const folder = settings.addFolder({name: 'Viewer', open: true});

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
      new BooleanController(config, 'combinedPanning')
        .setName('Comb. Pan')
        .onChange((value) => {
          if (value) {
            viewer.activateCombinedPanning();
          } else {
            viewer.deactivateCombinedPanning();
          }
        }),
    );

    folder.add(
      new OptionController(config, 'renderMode', [
        RenderMode[RenderMode.Fill],
        RenderMode[RenderMode.Letterbox],
      ])
        .setName('Render')
        .onChange((renderMode) => viewer.setRenderMode(RenderMode[renderMode])),
    );

    folder.add(
      new OptionController(config, 'transitionMode', [
        TransitionMode[TransitionMode.Default],
        TransitionMode[TransitionMode.Instantaneous],
      ])
        .setName('Transition')
        .onChange((transitionMode) =>
          viewer.setTransitionMode(TransitionMode[transitionMode]),
        ),
    );
  }
}

export function dispose() {
  if (viewer) {
    viewer.remove();
  }
}
