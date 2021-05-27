/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {Viewer} from '../../../mods/mapillary-js/dist/mapillary.module';

import {Folder} from '../options/Folder';
import {BooleanController} from '../options/BooleanController';

function makeFolder(container) {
  const folder = new Folder({open: true});
  container.appendChild(folder.container);
  return folder;
}

let viewer;

export function init(opts) {
  const {accessToken, container} = opts;
  const imageId = 'vBcUqs0vPik9KAb1TFq6iw';

  const componentOptions = {
    cover: false,
    keyboard: {
      keyPlay: false,
      keySequenceNavigation: false,
      keySpatialNavigation: false,
      keyZoom: false,
    },
  };
  const viewerOptions = {
    apiClient: accessToken,
    component: componentOptions,
    container,
  };

  viewer = new Viewer(viewerOptions);
  viewer.moveTo(imageId).catch((error) => console.warn(error));

  const pointerComponent = viewer.getComponent('keyboard');
  const settings = makeFolder(container);
  const config = {...componentOptions.keyboard};

  {
    const folder = settings.addFolder({
      name: 'Sequence Keyboard Handlers',
      open: true,
    });

    folder.add(
      new BooleanController(config, 'keyPlay')
        .setName('Play')
        .onChange((value) => {
          if (value) {
            pointerComponent.keyPlay.enable();
          } else {
            pointerComponent.keyPlay.disable();
          }
        }),
    );

    folder.add(
      new BooleanController(config, 'keySequenceNavigation')
        .setName('Navigation')
        .onChange((value) => {
          if (value) {
            pointerComponent.keySequenceNavigation.enable();
          } else {
            pointerComponent.keySequenceNavigation.disable();
          }
        }),
    );
  }

  {
    const folder = settings.addFolder({
      name: 'Spatial Keyboard Handlers',
      open: true,
    });

    folder.add(
      new BooleanController(config, 'keyZoom')
        .setName('Zoom')
        .onChange((value) => {
          if (value) {
            pointerComponent.keyZoom.enable();
          } else {
            pointerComponent.keyZoom.disable();
          }
        }),
    );

    folder.add(
      new BooleanController(config, 'keySpatialNavigation')
        .setName('Navigation')
        .onChange((value) => {
          if (value) {
            pointerComponent.keySpatialNavigation.enable();
          } else {
            pointerComponent.keySpatialNavigation.disable();
          }
        }),
    );
  }
}

export function dispose() {
  if (viewer) {
    viewer.remove();
  }
}
