/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {Viewer} from '../../../mods/mapillary-js/dist/mapillary.module';

import {Log} from '../options/Log';

let viewer;
let log;

export function init(opts) {
  const {accessToken, container} = opts;
  const imageId = 'kcXKtxR_S3ISk0zNR_TDnA';

  const viewerOptions = {
    apiClient: accessToken,
    component: {cover: false},
    container,
  };
  viewer = new Viewer(viewerOptions);
  viewer.moveTo(imageId).catch((error) => console.warn(error));

  log = new Log({
    container,
    header: 'Event Log Tail (last 30 seconds)',
    timeout: 30,
  });

  // Load events
  viewer.on('load', (event) => log.add(`'${event.type}`));
  viewer.on('dataloading', (event) => {
    log.add(`'${event.type}' - loading: ${event.loading}`);
  });

  // State events
  viewer.on('movestart', (event) => log.add(`'${event.type}'`));
  viewer.on('moveend', (event) => log.add(`'${event.type}'`));

  // Mouse events
  viewer.on('click', (event) => {
    const basic = event.basicPoint
      ? event.basicPoint.map((c) => c.toFixed(2)).join(', ')
      : null;
    log.add(`'${event.type}' - basic: [${basic}]`);
  });

  viewer.on('dblclick', (event) => {
    const lng = event.lngLat ? event.lngLat.lng.toFixed(1) : null;
    const lat = event.lngLat ? event.lngLat.lat.toFixed(1) : null;
    log.add(`'${event.type}' - lng: ${lng}, lat: ${lat}`);
  });

  viewer.on('contextmenu', (event) => {
    const pixel = event.pixelPoint.map((c) => c.toFixed(0)).join(', ');
    log.add(`'${event.type}' - pixel: [${pixel}]`);
  });

  // Viewpoint events
  viewer.on('bearing', (event) => {
    log.add(`'${event.type}' - bearing: ${event.bearing.toFixed(1)}`);
  });

  // Navigation events
  viewer.on('image', (event) => {
    log.add(`'${event.type}' - id: ${event.image.id}`);
  });

  viewer.on('sequenceedges', (event) => {
    log.add(`'${event.type}' - count: ${event.status.edges.length}`);
  });

  viewer.on('spatialedges', (event) => {
    log.add(`'${event.type}' - count: ${event.status.edges.length}`);
  });
}

export function dispose() {
  if (viewer) {
    viewer.remove();
  }
  if (log) {
    log.clear();
  }
}
