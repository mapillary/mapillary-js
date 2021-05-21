/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {
  isSupported,
  isFallbackSupported,
  Viewer,
} from '../../../mods/mapillary-js/dist/mapillary.module';

function makeMessage(content) {
  const message = document.createElement('div');
  message.style.backgroundColor = '#fff';
  message.style.boxShadow = '0px 0px 3px rgb(0 0 0 / 40%)';
  message.style.color = '#000';
  message.style.fontSize = '18px';
  message.style.padding = '4px 0';
  message.style.position = 'absolute';
  message.style.textAlign = 'center';
  message.style.top = '100px';
  message.style.width = '100%';
  message.innerHTML = content;
  return message;
}

function checkSupport() {
  let component = null;
  let message = null;

  if (isSupported()) {
    component = {cover: false};
    message = makeMessage('MapillaryJS is fully supported by your browser.');
  } else if (isFallbackSupported()) {
    component = {
      direction: false,
      cover: false,
      image: false,
      keyboard: false,
      mouse: false,
      sequence: false,
      zoom: false,
      fallback: {
        image: true,
        navigation: true,
      },
    };
    message = makeMessage(
      'MapillaryJS fallback functionality is supported by your browser.',
    );
  } else {
    message = makeMessage('MapillaryJS is not supported by your browser.');
  }

  return {
    component,
    message,
  };
}

let viewer;

export function init(opts) {
  const {container, accessToken} = opts;
  const {component, message} = checkSupport();

  if (component) {
    viewer = new Viewer({
      apiClient: accessToken,
      component,
      container,
    });

    const imageId = '6ZcXjb82YuNEtPNA3fqBzA';
    viewer.moveTo(imageId).catch((error) => console.error(error));
  }
  container.appendChild(message);
}

export function dispose() {
  if (viewer) {
    viewer.remove();
  }
}
