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
    pointer: {
      dragPan: false,
      scrollZoom: false,
      touchZoom: false,
    },
  };
  const viewerOptions = {
    apiClient: accessToken,
    component: componentOptions,
    container,
  };

  viewer = new Viewer(viewerOptions);
  viewer.moveTo(imageId).catch((error) => console.warn(error));

  const pointerComponent = viewer.getComponent('pointer');
  const settings = makeFolder(container);
  const config = {...componentOptions.pointer};

  settings.add(
    new BooleanController(config, 'dragPan')
      .setName('Drag Pan')
      .onChange((value) => {
        if (value) {
          pointerComponent.dragPan.enable();
        } else {
          pointerComponent.dragPan.disable();
        }
      }),
  );

  settings.add(
    new BooleanController(config, 'scrollZoom')
      .setName('Scroll Zoom')
      .onChange((value) => {
        if (value) {
          pointerComponent.scrollZoom.enable();
        } else {
          pointerComponent.scrollZoom.disable();
        }
      }),
  );

  settings.add(
    new BooleanController(config, 'touchZoom')
      .setName('Touch Zoom')
      .onChange((value) => {
        if (value) {
          pointerComponent.touchZoom.enable();
        } else {
          pointerComponent.touchZoom.disable();
        }
      }),
  );
}

export function dispose() {
  if (viewer) {
    viewer.remove();
  }
}
