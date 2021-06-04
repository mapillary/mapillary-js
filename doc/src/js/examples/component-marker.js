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

function createMarker(markerId, lngLat, color) {
  const marker = new SimpleMarker(markerId, lngLat, {
    ballColor: 0xffa500,
    ballOpacity: 0.9,
    color,
    opacity: 0.5,
    interactive: true,
  });
  return marker;
}

let viewer;

export function init(opts) {
  const {accessToken, container} = opts;
  const imageId = '1182252392217616';

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

  const interactiveColor = 0xffff00;
  markerComponent.add([
    createMarker(
      'interactive-1',
      {
        lat: 33.34472,
        lng: -118.3267,
      },
      interactiveColor,
    ),
    createMarker(
      'interactive-2',
      {
        lat: 33.34475,
        lng: -118.32672,
      },
      interactiveColor,
    ),
    new SimpleMarker(
      'fixed-1',
      {
        lat: 33.34473,
        lng: -118.32671,
      },
      {ballColor: 0x000000, ballOpacity: 0.5},
    ),
  ]);

  const hover = {
    lastPixel: null,
    dragging: null,
    marker: null,
    color: 0xffa500,
  };

  const onHover = (markerId) => {
    const {dragging, marker} = hover;
    // Do not update when dragging to keep hovered color
    if (dragging) {
      return;
    }

    if (!markerId && marker) {
      // Remove hovered
      hover.marker = null;
      const nonHovered = createMarker(
        marker.id,
        marker.lngLat,
        interactiveColor,
      );

      markerComponent.add([nonHovered]);
    } else if (markerId && !marker) {
      // Set hovered
      hover.marker = createMarker(
        markerId,
        markerComponent.get(markerId).lngLat,
        hover.color,
      );

      markerComponent.add([hover.marker]);
    } else if (marker && marker.id !== markerId) {
      // Change hovered
      const nonHovered = createMarker(
        marker.id,
        marker.lngLat,
        interactiveColor,
      );
      hover.marker = createMarker(
        markerId,
        markerComponent.get(markerId).lngLat,
        hover.color,
      );

      markerComponent.add([nonHovered, hover.marker]);
    }
  };

  const onPixelPoint = async (pixelPoint) => {
    hover.lastPixel = pixelPoint;
    if (!pixelPoint) {
      onHover(null);
    } else {
      const markerId = await markerComponent.getMarkerIdAt(pixelPoint);
      onHover(markerId);
    }
  };

  const onMouse = (event) => {
    const {pixelPoint} = event;
    onPixelPoint(pixelPoint);
  };

  // Store last position to uproject on drag end and update hover state
  viewer.on('mousemove', onMouse);
  viewer.on('mouseover', onMouse);
  viewer.on('mouseup', onMouse);

  // Reset hover state on mouse out
  viewer.on('mouseout', () => onPixelPoint(null));

  // Change hovered marker on move end if last position is
  // defined (i.e. mouse is over Viewer).
  viewer.on('moveend', () => {
    onPixelPoint(hover.lastPixel);
  });

  // Handle dragging
  markerComponent.on('markerdragstart', (event) => {
    hover.dragging = event.marker.id;
  });
  markerComponent.on('markerdragend', () => {
    hover.dragging = null;
    onPixelPoint(hover.lastPixel);
  });
}

export function dispose() {
  if (viewer) {
    viewer.remove();
  }
}
