/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {
  SimpleMarker,
  Viewer,
} from '../../../mods/mapillary-js/dist/mapillary.module';

function randomColor() {
  return `#${Math.floor(Math.random() * 16777215)
    .toString(16)
    .padStart(6, '0')}`;
}

function lerp(v0, v1, t) {
  return v0 + t * (v1 - v0);
}

function createRandomMarkers(start, count, center) {
  const boxWidth = 0.1;
  const minLat = center.lat - boxWidth / 2;
  const maxLat = center.lat + boxWidth / 2;
  const minLng = center.lng - boxWidth / 2;
  const maxLng = center.lng + boxWidth / 2;

  const markers = [];
  for (let i = start; i < start + count; i++) {
    const markerId = i.toString();
    const lngLat = {
      lat: lerp(minLat, maxLat, Math.random()),
      lng: lerp(minLng, maxLng, Math.random()),
    };
    const color = randomColor();
    const options = {interactive: true, color, ballColor: color};
    const marker = new SimpleMarker(markerId, lngLat, options);
    markers.push(marker);
  }

  return markers;
}

let viewer;

export function init(opts) {
  const {accessToken, container} = opts;
  const imageId = '147617667372938';

  const componentOptions = {
    cover: false,
    marker: true,
  };
  const viewerOptions = {
    accessToken,
    component: componentOptions,
    container,
  };

  viewer = new Viewer(viewerOptions);
  viewer.moveTo(imageId).catch((error) => console.warn(error));

  const markerComponent = viewer.getComponent('marker');

  viewer.on(
    'load',
    async () => {
      let count = 0;
      const batchSize = 1000;
      const image = await viewer.getImage();

      const intervalId = window.setInterval(() => {
        const markers = createRandomMarkers(count, batchSize, image.lngLat);
        markerComponent.add(markers);

        count += batchSize;
        if (count >= 1e6) {
          window.clearInterval(intervalId);
        }
      }, 5);
    },
    (error) => console.error(error),
  );
}

export function dispose() {
  if (viewer) {
    viewer.remove();
  }
}
