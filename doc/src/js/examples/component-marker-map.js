/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import mapboxgl from 'mapbox-gl';

import {
  CircleMarker,
  SimpleMarker,
  Viewer,
} from '../../../mods/mapillary-js/dist/mapillary.module';

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
  const backgroundColor = options.backgroundColor ?? 'rgba(255, 255, 255, 0.6)';
  const size = `${2 * options.radius}px`;
  const circle = document.createElement('div');
  circle.style.border = `3px solid ${options.color}`;
  circle.style.backgroundColor = backgroundColor;
  circle.style.height = `${size}`;
  circle.style.borderRadius = '50%';
  circle.style.width = `${size}`;
  return new mapboxgl.Marker({
    draggable: options.draggable,
    element: circle,
    rotationAlignment: 'map',
  });
}

class MarkerSynchronizer {
  constructor(options) {
    this.markers = new Map();
    this.markerComponent = options.viewer.getComponent('marker');
    this.map = options.map;
    this.viewer = options.viewer;
    this.handlers = new Map();

    this.markerId = 0;

    this.onMarkerPosition = (event) => {
      const {marker} = event;
      const synchronized = this.markers.get(marker.id);
      synchronized.map.setLngLat(marker.lngLat);
    };

    this.onDrag = (event) => {
      const {target} = event;
      const id = target.getElement().getAttribute('marker-id');
      const lngLat = target.getLngLat();
      this.markerComponent.add([
        new SimpleMarker(id, lngLat, {interactive: true}),
      ]);
    };

    this.markerComponent.on('markerposition', this.onMarkerPosition);
  }

  add(lngLat) {
    this.markerId += 1;
    const id = this.markerId.toString();
    const viewerMarker = new SimpleMarker(id, lngLat, {interactive: true});
    this.markerComponent.add([viewerMarker]);

    const mapMarker = makeMapboxMarker({
      color: '#f00',
      draggable: true,
      radius: 10,
    }).setLngLat(lngLat);
    mapMarker.getElement().setAttribute('marker-id', id);
    mapMarker.addTo(this.map);

    this.markers.set(id, {viewer: viewerMarker, map: mapMarker});

    mapMarker.on('drag', this.onDrag);
    mapMarker.on('dragstart', () => this.fire({type: 'markerdragstart'}));
    mapMarker.on('dragend', () => this.fire({type: 'markerdragend'}));
  }

  on(type, handler) {
    this.handlers.set(type, handler);
  }

  fire(event) {
    if (!this.handlers.has(event.type)) {
      return;
    }
    const handler = this.handlers.get(event.type);
    handler(event);
  }
}

class IndicatorMarker {
  constructor(options) {
    this.markerComponent = options.markerComponent;

    const color = '#ff0';
    this.options = {color};
    const lngLat = {lat: 0, lng: 0};
    this.viewer = new CircleMarker('indicator', lngLat, this.options);

    this.map = makeMapboxMarker({
      radius: 14,
      color,
      backgroundColor: 'rgba(200, 200, 0, 0.6)',
    })
      .setLngLat(lngLat)
      .addTo(options.map);
    this.map.getElement().style.visibility = 'collapse';
  }

  setLngLat(lngLat) {
    if (lngLat) {
      this.viewer = new CircleMarker(this.viewer.id, lngLat, this.options);
      this.markerComponent.add([this.viewer]);
      this.map.getElement().style.visibility = 'visible';
      this.map.setLngLat(lngLat);
    } else {
      this.viewer = new CircleMarker(this.viewer.id, this.viewer.lngLat, {
        opacity: 0,
      });
      this.markerComponent.add([this.viewer]);
      this.map.getElement().style.visibility = 'collapse';
    }
  }
}

class HoverIndicator {
  constructor(options) {
    this.map = options.map;
    this.viewer = options.viewer;
    this.markerComponent = options.viewer.getComponent('marker');
    this.synchronizer = options.synchronizer;

    this.indicator = new IndicatorMarker({
      markerComponent: this.markerComponent,
      map: options.map,
    });

    this.onLastPixel = async (state) => {
      if (!state.lastPixel) {
        this.indicator.setLngLat(null);
      } else {
        // Unproject the last position and move indicator
        const lngLat = await this.viewer.unproject(state.lastPixel);
        this.indicator.setLngLat(lngLat);
      }
    };

    this.mapState = {
      lastPixel: null,
      moving: false,
      dragging: false,
    };

    this.viewerState = {
      lastPixel: null,
      moving: false,
      dragging: false,
    };
  }

  listen() {
    this.initSynchronizer();
    this.initMap();
    this.initViewer();
  }

  initSynchronizer() {
    const state = this.mapState;
    this.synchronizer.on('markerdragstart', () => {
      state.dragging = true;
      this.indicator.setLngLat(null);
    });
    this.synchronizer.on('markerdragend', () => {
      state.dragging = false;
      this.onLastPixel(state);
    });
  }

  initMap() {
    const state = this.mapState;
    const onMousePress = (event) => {
      state.lastPixel = event.point;
      this.indicator.setLngLat(event.lngLat);
    };
    this.map.on('mouseup', onMousePress);
    this.map.on('mousedown', onMousePress);

    const onMouseMove = (event) => {
      state.lastPixel = event.point;
      if (state.moving || state.dragging) {
        return;
      }
      this.indicator.setLngLat(event.lngLat);
    };
    this.map.on('mousemove', onMouseMove);
    this.map.on('mouseover', onMouseMove);

    this.map.on('mouseout', () => {
      state.lastPixel = null;
      if (state.moving || state.dragging) {
        return;
      }
      this.indicator.setLngLat(null);
    });

    this.map.on('movestart', () => {
      state.moving = true;
    });
    this.map.on('moveend', () => {
      state.moving = false;
    });
  }

  initViewer() {
    const state = this.viewerState;
    const onMouse = (event) => {
      state.lastPixel = event.pixelPoint;
      this.indicator.setLngLat(event.lngLat);
    };
    this.viewer.on('mouseup', onMouse);
    this.viewer.on('mouseover', onMouse);
    this.viewer.on('mousedown', onMouse);

    this.viewer.on('mousemove', (event) => {
      state.lastPixel = event.pixelPoint;
      if (state.moving || state.dragging) {
        return;
      }

      this.indicator.setLngLat(event.lngLat);
    });

    this.viewer.on('mouseout', () => {
      state.lastPixel = null;
      this.indicator.setLngLat(null);
    });

    this.viewer.on('movestart', () => {
      state.moving = true;
    });
    this.viewer.on('moveend', () => {
      state.moving = false;
      this.onLastPixel(state);
    });

    this.markerComponent.on('markerdragstart', () => {
      state.dragging = true;
      this.indicator.setLngLat(null);
    });

    this.markerComponent.on('markerdragend', () => {
      state.dragging = false;
      this.onLastPixel(state);
    });
  }
}

let viewer;
let map;

export function init(opts) {
  const {accessToken, mapboxAccessToken, container} = opts;
  const imageId = 'm-slOlK_DYuHWHJSxeJd7g';
  const containers = makeContainers(container);

  const componentOptions = {
    cover: false,
    marker: true,
  };
  const viewerOptions = {
    apiClient: accessToken,
    component: componentOptions,
    container: containers.viewer,
  };

  viewer = new Viewer(viewerOptions);
  viewer.moveTo(imageId).catch((error) => console.warn(error));

  const markerComponent = viewer.getComponent('marker');

  mapboxgl.accessToken = mapboxAccessToken;
  map = new mapboxgl.Map({
    container: containers.map,
    pitch: 65,
    style: 'mapbox://styles/mapbox/streets-v11',
    zoom: 20,
  });

  const synchronizer = new MarkerSynchronizer({map, viewer});
  const hoverIndicator = new HoverIndicator({map, viewer, synchronizer});
  hoverIndicator.listen();

  map.on('click', async (event) => {
    synchronizer.add(event.lngLat);
  });
  viewer.on('click', async (event) => {
    const {lngLat, pixelPoint} = event;
    if (!lngLat) {
      return;
    }

    // Only create a new marker if no interactive markers are hovered
    const markerId = await markerComponent.getMarkerIdAt(pixelPoint);
    if (markerId) {
      return;
    }
    synchronizer.add(lngLat);
  });

  // Image position indicator
  const positionMarker = makeMapboxMarker({radius: 14, color: '#f0f'});

  const onPosition = async () => {
    const lngLat = await viewer.getPosition();
    positionMarker.setLngLat(lngLat);
    map.setCenter(lngLat);
  };

  viewer.on('position', onPosition);
  viewer.on('load', async () => {
    await onPosition();
    positionMarker.addTo(map);
  });

  viewer.on('pov', async () => {
    const pov = await viewer.getPointOfView();
    map.setBearing(pov.bearing);
    const lngLat = await viewer.getPosition();
    map.setCenter(lngLat);
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
