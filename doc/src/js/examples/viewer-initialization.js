/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {Viewer} from '../../../mods/mapillary-js/dist/mapillary.module';

let viewer1;
let viewer2;
let viewer3;
let viewer4;

function makeContainer(parent) {
  const container = document.createElement('div');
  container.style.width = 'calc(25% - 2px)';
  container.style.height = 'calc(100% - 2px)';
  container.style.display = 'inline-block';
  container.style.margin = '1px';
  parent.appendChild(container);
  return container;
}

export function init(opts) {
  const {accessToken, container} = opts;
  const imageId = '6ZcXjb82YuNEtPNA3fqBzA';

  // Initialize with cover active
  // Viewer is not navigable when cover is active
  viewer1 = new Viewer({
    apiClient: accessToken,
    container: makeContainer(container),
    imageId,
  });
  console.info('viewer1 - is navigable:', viewer1.isNavigable);
  viewer1.moveTo(imageId).catch((error) => {
    console.warn('viewer1', error.message);
  });

  // Initialize with automatic cover deactivation
  // Viewer is not navigable when cover is active and loading
  viewer2 = new Viewer({
    apiClient: accessToken,
    component: {cover: false},
    container: makeContainer(container),
    imageId,
  });
  console.info('viewer2 - is navigable:', viewer2.isNavigable);
  viewer2.moveTo(imageId).catch((error) => {
    console.warn('viewer2', error.message);
  });

  // Initialize without an image ID
  // Viewer is navigable immediately when initialized without image ID
  viewer3 = new Viewer({
    apiClient: accessToken,
    container: makeContainer(container),
  });
  console.info('viewer3 - is navigable:', viewer3.isNavigable);
  viewer3.moveTo('6ZcXjb82YuNEtPNA3fqBzA').then(
    (image) => console.info('viewer3 - navigated to:', image.id),
    (error) => console.error('viewer3', error),
  );

  // Initialize with cover deactivation, without image ID
  // This is equivalent to initialization #3
  // Viewer is always navigable immediately when initialized without image ID
  viewer4 = new Viewer({
    apiClient: accessToken,
    component: {cover: false},
    container: makeContainer(container),
  });
  console.info('viewer4 - is navigable:', viewer4.isNavigable);
  viewer4.moveTo('6ZcXjb82YuNEtPNA3fqBzA').then(
    (image) => console.info('viewer4 - navigated to:', image.id),
    (error) => console.error('viewer4', error),
  );

  const onNavigable = (name) => {
    return (event) => {
      console.info(name, '- navigable changed to:', event.navigable);
    };
  };
  viewer1.on('navigable', onNavigable('viewer1'));
  viewer2.on('navigable', onNavigable('viewer2'));
  viewer3.on('navigable', onNavigable('viewer3'));
  viewer4.on('navigable', onNavigable('viewer4'));
}

export function dispose() {
  if (viewer1) {
    viewer1.remove();
  }
  if (viewer2) {
    viewer2.remove();
  }
  if (viewer3) {
    viewer3.remove();
  }
  if (viewer4) {
    viewer4.remove();
  }
}
