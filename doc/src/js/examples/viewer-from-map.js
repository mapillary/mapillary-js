/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import mapboxgl from 'mapbox-gl';

import {Viewer} from '../../../mods/mapillary-js/dist/mapillary.module';

const SOURCE = {
  type: 'geojson',
  data: {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {
          imageId: '1155477361601810',
        },
        geometry: {
          type: 'Point',
          coordinates: [-122.34098542513662, 47.61239453991757],
        },
      },
      {
        type: 'Feature',
        properties: {
          imageId: '210400870916819',
        },
        geometry: {
          type: 'Point',
          coordinates: [-122.34176298993145, 47.61176596318449],
        },
      },
      {
        type: 'Feature',
        properties: {
          imageId: '1088588038329507',
        },
        geometry: {
          type: 'Point',
          coordinates: [-122.34220623895305, 47.61318608939534],
        },
      },
      {
        type: 'Feature',
        properties: {
          imageId: '136571571843306',
        },
        geometry: {
          type: 'Point',
          coordinates: [-122.34293313637096, 47.6123862243017],
        },
      },
    ],
  },
};

function makeMapboxMarker(options) {
  const size = `${2 * options.radius}px`;
  const circle = document.createElement('div');
  circle.style.border = `3px solid ${options.color}`;
  circle.style.backgroundColor = 'rgba(255, 255, 255, 0.6)';
  circle.style.height = `${size}`;
  circle.style.borderRadius = '50%';
  circle.style.width = `${size}`;
  return new mapboxgl.Marker({
    element: circle,
    rotationAlignment: 'map',
  });
}

function makeMessage(content) {
  const message = document.createElement('div');
  message.style.backgroundColor = '#fff';
  message.style.boxShadow = '0px 0px 3px rgb(0 0 0 / 40%)';
  message.style.color = '#000';
  message.style.fontSize = '18px';
  message.style.fontWeight = '300';
  message.style.padding = '4px 8px';
  message.style.position = 'relative';
  message.style.textAlign = 'center';
  message.style.top = '30%';
  message.style.width = '40%';
  message.style.left = '10.9%';
  message.style.borderRadius = '2px';
  message.innerHTML = content;
  return message;
}

function makeContainers(container) {
  const boundingRect = container.getBoundingClientRect();
  const height = `calc(100vh - ${boundingRect.top}px)`;

  const viewerContainer = document.createElement('div');
  viewerContainer.style.position = 'absolute';
  viewerContainer.style.height = height;
  viewerContainer.style.width = '61.8%';

  const mapContainer = document.createElement('div');
  mapContainer.style.position = 'absolute';
  mapContainer.style.right = '0px';
  mapContainer.style.height = height;
  mapContainer.style.width = 'calc(38.2% - 2px)';
  mapContainer.style.marginLeft = '2px';

  container.appendChild(viewerContainer);
  container.appendChild(mapContainer);

  return {
    viewer: viewerContainer,
    map: mapContainer,
  };
}

let viewer;
let map;

export function init(opts) {
  const {accessToken, mapboxAccessToken, container} = opts;

  const containers = makeContainers(container);
  const viewerOptions = {
    accessToken,
    component: {
      cover: false,
    },
    container: containers.viewer,
  };
  viewer = new Viewer(viewerOptions);

  mapboxgl.accessToken = mapboxAccessToken;
  map = new mapboxgl.Map({
    container: containers.map,
    style: 'mapbox://styles/mapbox/streets-v11',
    zoom: 15,
    center: [-122.34095574541155, 47.61238810988727],
  });

  const message = makeMessage(
    'Click the image markers on the map to move the viewer.',
  );
  container.appendChild(message);

  const positionMarker = makeMapboxMarker({radius: 8, color: '#f0f'});

  const onImage = (image) => {
    const lngLat = [image.lngLat.lng, image.lngLat.lat];
    if (!map.getBounds().contains(lngLat)) {
      map.setCenter(lngLat);
    }
  };

  const onPosition = async () => {
    const position = await viewer.getPosition();
    const pos = [position.lng, position.lat];
    positionMarker.setLngLat(pos);
  };

  viewer.on('load', async () => {
    container.removeChild(message);
    const image = await viewer.getImage();
    onImage(image);
    await onPosition();
    positionMarker.addTo(map);
  });
  viewer.on('image', (event) => onImage(event.image));

  viewer.on('position', onPosition);

  map.on('load', () => {
    map.addSource('images', SOURCE);
    map.addLayer({
      id: 'images',
      type: 'circle',
      source: 'images',
      paint: {
        'circle-radius': 12,
        'circle-opacity': 0.5,
        'circle-color': '#05CB63',
        'circle-stroke-color': '#05CB63',
        'circle-stroke-width': 2,
      },
    });
  });

  map.on('click', (event) => {
    const features = map.queryRenderedFeatures(event.point, {
      layers: ['images'],
    });
    if (!features.length) {
      return;
    }

    const closest = features[0];
    const {imageId} = closest.properties;
    viewer.moveTo(imageId).catch((error) => console.warn(error));
  });
}

export function dispose() {
  if (viewer) {
    viewer.remove();
  }
  if (map) {
    map.remove();
  }
}
