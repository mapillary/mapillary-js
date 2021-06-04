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
  ComponentSize,
  RenderMode,
  TransitionMode,
  Viewer,
} from '../../../mods/mapillary-js/dist/mapillary.module';

let viewer;

export function init(opts) {
  const {accessToken, container} = opts;

  const componentOptions = {
    bearing: {size: ComponentSize.Large},
    cache: false,
    cover: false,
    direction: {maxWidth: 300},
    keyboard: {keyZoom: false},
    pointer: {scrollZoom: false},
    sequence: false,
    zoom: false,
  };
  const viewerOptions = {
    accessToken,
    cameraControls: CameraControls.Street,
    combinedPanning: false,
    component: componentOptions,
    container,
    imageId: '1211723002580553',
    imageTiling: false,
    renderMode: RenderMode.Letterbox,
    trackResize: false,
    transitionMode: TransitionMode.Instantaneous,
  };

  viewer = new Viewer(viewerOptions);

  // We deactivated `trackResize` so we need to resize manually
  window.addEventListener('resize', () => viewer.resize());
}

export function dispose() {
  if (viewer) {
    viewer.remove();
  }
}
