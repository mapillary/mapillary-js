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
  const imageId = '1211723002580553';

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
    accessToken,
    component: componentOptions,
    container,
  };

  viewer = new Viewer(viewerOptions);
  viewer.moveTo(imageId).catch((error) => console.warn(error));

  const pointerComponent = viewer.getComponent('keyboard');
  const settings = makeFolder(container);
  const config = {...componentOptions.keyboard};

  const handleChange = (handler) => {
    return (value) => {
      if (value) {
        handler.enable();
      } else {
        handler.disable();
      }
    };
  };

  {
    const folder = settings.addFolder({
      name: 'Sequence Keyboard Handlers',
      open: true,
    });
    folder.add(
      new BooleanController(config, 'keyPlay')
        .setName('Play')
        .onChange(handleChange(pointerComponent.keyPlay)),
    );
    folder.add(
      new BooleanController(config, 'keySequenceNavigation')
        .setName('Navigation')
        .onChange(handleChange(pointerComponent.keySequenceNavigation)),
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
        .onChange(handleChange(pointerComponent.keyZoom)),
    );
    folder.add(
      new BooleanController(config, 'keySpatialNavigation')
        .setName('Navigation')
        .onChange(handleChange(pointerComponent.keySpatialNavigation)),
    );
  }
}

export function dispose() {
  if (viewer) {
    viewer.remove();
  }
}
