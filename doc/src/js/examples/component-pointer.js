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

  const handleChange = (handler) => {
    return (value) => {
      if (value) {
        handler.enable();
      } else {
        handler.disable();
      }
    };
  };

  settings.add(
    new BooleanController(config, 'dragPan')
      .setName('Drag Pan')
      .onChange(handleChange(pointerComponent.dragPan)),
  );
  settings.add(
    new BooleanController(config, 'scrollZoom')
      .setName('Scroll Zoom')
      .onChange(handleChange(pointerComponent.scrollZoom)),
  );
  settings.add(
    new BooleanController(config, 'touchZoom')
      .setName('Touch Zoom')
      .onChange(handleChange(pointerComponent.touchZoom)),
  );
}

export function dispose() {
  if (viewer) {
    viewer.remove();
  }
}
