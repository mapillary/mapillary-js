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

const RAD2DEG = 180 / Math.PI;
const DEG2RAD = Math.PI / 180;

function rotateArc(bearing) {
  return `rotateZ(${bearing}deg)`;
}

function makeArc(fov) {
  const radius = 45;
  const centerX = 50;
  const centerY = 50;

  const fovRad = DEG2RAD * fov;

  const arcStart = -Math.PI / 2 - fovRad / 2;
  const arcEnd = arcStart + fovRad;

  const startX = centerX + radius * Math.cos(arcStart);
  const startY = centerY + radius * Math.sin(arcStart);

  const endX = centerX + radius * Math.cos(arcEnd);
  const endY = centerY + radius * Math.sin(arcEnd);

  const center = `M ${centerX} ${centerY}`;
  const line = `L ${startX} ${startY}`;
  const arc = `A ${radius} ${radius} 0 0 1 ${endX} ${endY}`;

  return `${center} ${line} ${arc} Z`;
}

function makeCamera(bearing, fov) {
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');

  path.setAttribute('d', makeArc(fov));
  path.setAttribute('fill', 'yellow');
  path.setAttribute('fill-opacity', '0.5');
  path.setAttribute('stroke', 'black');
  path.setAttribute('stroke-width', '1');
  path.setAttribute('stroke-linejoin', 'round');

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 100 100');
  svg.appendChild(path);

  svg.style.height = '100%';
  svg.style.width = '100%';
  svg.style.transform = rotateArc(bearing);

  const container = document.createElement('div');
  container.style.height = '200px';
  container.style.width = '200px';
  container.appendChild(svg);

  return container;
}

let viewer;
let map;

export function init(opts) {
  const {accessToken, mapboxAccessToken, container} = opts;
  const imageId = '524779645570864';

  const containers = makeContainers(container);

  const viewerOptions = {
    accessToken,
    component: {cover: false},
    container: containers.viewer,
  };
  viewer = new Viewer(viewerOptions);
  viewer.moveTo(imageId).catch((error) => console.warn(error));

  mapboxgl.accessToken = mapboxAccessToken;
  map = new mapboxgl.Map({
    container: containers.map,
    pitch: 45,
    style: 'mapbox://styles/mapbox/streets-v11',
    zoom: 18,
  });

  const camera = makeCamera(0, 90);
  const cameraMarker = new mapboxgl.Marker({
    color: '#FFFFFF',
    element: camera,
    rotationAlignment: 'map',
  });

  const originalMarker = makeMapboxMarker({radius: 14, color: '#f00'});
  const lngLatMarker = makeMapboxMarker({radius: 14, color: '#00f'});
  const positionMarker = makeMapboxMarker({radius: 10, color: '#f0f'});

  const onImage = (image) => {
    const lngLat = [image.lngLat.lng, image.lngLat.lat];
    lngLatMarker.setLngLat(lngLat);
    if (!map.getBounds().contains(lngLat)) {
      map.setCenter(lngLat);
    }

    const originalPos = [image.originalLngLat.lng, image.originalLngLat.lat];
    originalMarker.setLngLat(originalPos);
  };

  const onFov = async () => {
    const viewerContainer = viewer.getContainer();
    const height = viewerContainer.offsetHeight;
    const width = viewerContainer.offsetWidth;
    const aspect = height === 0 ? 0 : width / height;

    const verticalFov = DEG2RAD * (await viewer.getFieldOfView());
    const horizontalFov =
      RAD2DEG * Math.atan(aspect * Math.tan(0.5 * verticalFov)) * 2;

    const path = camera.querySelector('path');
    path.setAttribute('d', makeArc(horizontalFov));
  };

  const onPov = async () => {
    const pov = await viewer.getPointOfView();
    const svg = camera.querySelector('svg');
    svg.style.transform = rotateArc(pov.bearing);
  };

  const onPosition = async () => {
    const position = await viewer.getPosition();
    const pos = [position.lng, position.lat];
    positionMarker.setLngLat(pos);
    cameraMarker.setLngLat(pos);
  };

  viewer.on('load', async () => {
    const image = await viewer.getImage();
    onImage(image);

    await onFov();
    await onPov();
    await onPosition();

    lngLatMarker.addTo(map);
    originalMarker.addTo(map);
    positionMarker.addTo(map);
    cameraMarker.addTo(map);
  });

  viewer.on('image', (event) => onImage(event.image));

  viewer.on('position', onPosition);

  viewer.on('fov', onFov);
  window.addEventListener('resize', onFov);

  viewer.on('pov', onPov);
}

export function dispose() {
  if (viewer) {
    viewer.remove();
  }
  if (map) {
    map.remove();
  }
}
