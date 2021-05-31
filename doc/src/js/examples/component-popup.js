/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {
  Alignment,
  Popup,
  Viewer,
} from '../../../mods/mapillary-js/dist/mapillary.module';

let viewer;

export function init(opts) {
  const {accessToken, container} = opts;
  const imageId = 'FnqSkFAZXjv4Uqmqd4X_NA';

  const componentOptions = {
    cover: false,
    popup: true,
  };
  const viewerOptions = {
    apiClient: accessToken,
    component: componentOptions,
    container,
  };

  viewer = new Viewer(viewerOptions);
  const popupComponent = viewer.getComponent('popup');

  viewer.moveTo(imageId).catch((error) => console.warn(error));

  // Parking sign
  const signText = document.createElement('span');
  signText.style.color = '#000';
  signText.textContent = 'parking sign';
  const sign = new Popup({offset: 10});

  sign.setDOMContent(signText);
  sign.setBasicPoint([0.546, 0.507]);

  // Parking meter
  const meterContent = document.createElement('div');
  meterContent.style.backgroundColor = '#fff';
  meterContent.style.border = '2px solid red';
  meterContent.style.color = '#f00';
  meterContent.style.padding = '5px 10px';
  meterContent.textContent = 'parking meter';

  const meter = new Popup({
    capturePointer: false,
    clean: true,
    float: Alignment.Right,
    offset: 18,
    opacity: 0.7,
  });
  meter.setDOMContent(meterContent);
  meter.setBasicPoint([0.548, 0.583]);

  const onImage = (event) => {
    if (event.image.id === imageId) {
      popupComponent.add([sign, meter]);
    } else {
      popupComponent.removeAll();
    }
  };
  viewer.on('image', onImage);
}

export function dispose() {
  if (viewer) {
    viewer.remove();
  }
}
