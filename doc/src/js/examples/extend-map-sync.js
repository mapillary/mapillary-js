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
  BoxGeometry,
  Camera,
  Group,
  MathUtils,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  Scene,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three';

import {
  geodeticToEnu,
  RenderPass,
  Viewer,
} from '../../mapillary-js/dist/mapillary.module';

function makeInstructions() {
  const message = document.createElement('div');
  message.style.backgroundColor = '#fff';
  message.style.boxShadow = '0px 0px 3px rgb(0 0 0 / 40%)';
  message.style.color = '#000';
  message.style.fontSize = '10px';
  message.style.padding = '2px 8px';
  message.style.position = 'absolute';
  message.style.top = '16px';
  message.style.right = '16px';
  message.style.width = 'calc(100% - 32px)';
  message.style.maxWidth = '256px';

  const create = document.createElement('li');
  create.textContent = 'Double click on ground to create a cube';
  const move = document.createElement('li');
  move.textContent = 'Use the move handle to reposition the cube';
  const rotate = document.createElement('li');
  rotate.textContent = 'Use the rotation handle to rotate the cube';

  message.appendChild(create);
  message.appendChild(move);
  message.appendChild(rotate);
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

function makeCircleMarker(options) {
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

function makeMoveMarker(options) {
  const {size} = options;
  const square = document.createElement('div');
  square.style.border = `1px solid rgba(0, 0, 0, 0.2)`;
  square.style.backgroundColor = 'rgba(255, 255, 255, 0.6)';
  square.style.height = '100%';
  square.style.pointerEvents = 'initial';
  square.style.cursor = 'move';
  const container = document.createElement('div');
  container.appendChild(square);
  container.style.height = `${size}px`;
  container.style.width = `${size}px`;
  container.style.pointerEvents = 'none';
  return new mapboxgl.Marker({
    draggable: true,
    element: container,
    rotationAlignment: 'map',
  });
}

function makeRotationMarker(options) {
  const size = `${2 * options.radius}px`;
  const arc = document.createElement('div');
  arc.style.borderBottom = `2px solid black`;
  arc.style.background = 'none';
  arc.style.borderRadius = '50%';
  arc.style.height = '100%';
  arc.style.pointerEvents = 'initial';
  arc.style.cursor = 'ew-resize';
  const container = document.createElement('div');
  container.appendChild(arc);
  container.style.height = `${size}`;
  container.style.width = `${size}`;
  container.style.pointerEvents = 'none';

  return new mapboxgl.Marker({
    element: container,
    rotationAlignment: 'map',
  });
}

function makeMapTransform(origin, altitude) {
  const mercatorCoordinate = mapboxgl.MercatorCoordinate.fromLngLat(
    origin,
    altitude,
  );
  const transform = {
    translateX: mercatorCoordinate.x,
    translateY: mercatorCoordinate.y,
    translateZ: mercatorCoordinate.z,
    rotateX: 0,
    rotateY: 0,
    rotateZ: 0,
    scale: mercatorCoordinate.meterInMercatorCoordinateUnits(),
  };
  return transform;
}

function makeCubeMesh(size) {
  const geometry = new BoxGeometry(size, size, size);
  const materials = [
    new MeshBasicMaterial({
      color: 0xffff00,
    }),
    new MeshBasicMaterial({
      color: 0xff00ff,
    }),
    new MeshBasicMaterial({
      color: 0x00ff00,
    }),
    new MeshBasicMaterial({
      color: 0x0000ff,
    }),
    new MeshBasicMaterial({
      color: 0xffffff,
    }),
    new MeshBasicMaterial({
      color: 0xff0000,
    }),
  ];
  return new Mesh(geometry, materials);
}

class Cube {
  constructor(options) {
    const {lngLat, map, reference, viewer} = options;

    this.id = MathUtils.generateUUID();

    this.reference = reference;
    this.rotation = 0;
    this.size = 2;

    this.viewerMesh = makeCubeMesh(this.size);
    this.mapMesh = makeCubeMesh(this.size);
    this._setLngLat(lngLat);

    const onDrag = (event) => {
      const {target} = event;
      const movedLngLAt = target.getLngLat();
      this._setLngLat(movedLngLAt);
      this.rotator.setLngLat(movedLngLAt);
      viewer.triggerRerender();
      map.triggerRepaint();
    };
    this.mover = makeMoveMarker({size: 16}).setLngLat(lngLat);
    this.mover.on('drag', onDrag);
    this.rotator = this._makeRotator(lngLat, map, viewer, this.mover);
  }

  _makeRotator(lngLat, map, viewer) {
    const rotator = makeRotationMarker({radius: 24}).setLngLat(lngLat);
    const element = rotator.getElement().firstChild;

    const container = map.getCanvas();
    const rotateStart = new Vector2();
    const rotateEnd = new Vector2();
    const rotateDelta = new Vector2();

    const onPointerMove = (event) => {
      rotateEnd.set(event.clientX, event.clientY);
      rotateDelta.subVectors(rotateEnd, rotateStart);

      const angle = (360 * rotateDelta.x) / container.clientWidth;
      this.rotation -= angle;

      const transform = `rotateZ(${this.rotation}deg)`;
      element.style.transform = transform;
      this.mover.getElement().firstChild.style.transform = transform;

      this.viewerMesh.rotateZ(MathUtils.degToRad(angle));
      this.mapMesh.rotateZ(MathUtils.degToRad(angle));

      rotateStart.copy(rotateEnd);

      map.triggerRepaint();
      viewer.triggerRerender();
    };

    const onPointerUp = () => {
      element.ownerDocument.removeEventListener('pointermove', onPointerMove);
      element.ownerDocument.removeEventListener('pointerup', onPointerUp);
    };

    const onPointerDown = (event) => {
      event.stopPropagation();
      event.preventDefault();
      rotateStart.set(event.clientX, event.clientY);

      element.ownerDocument.addEventListener('pointermove', onPointerMove);
      element.ownerDocument.addEventListener('pointerup', onPointerUp);
    };

    element.addEventListener('pointerdown', onPointerDown);

    return rotator;
  }

  _setLngLat(lngLat) {
    const centerAltitude = this.size / 2;
    const viewerPosition = geodeticToEnu(
      lngLat.lng,
      lngLat.lat,
      // Invent ground 2 meters below reference
      this.reference.alt - 2 + centerAltitude,
      this.reference.lng,
      this.reference.lat,
      this.reference.alt,
    );
    this.viewerMesh.position.fromArray(viewerPosition);

    const mapPosition = geodeticToEnu(
      lngLat.lng,
      lngLat.lat,
      centerAltitude,
      this.reference.lng,
      this.reference.lat,
      0,
    );
    this.mapMesh.position.fromArray(mapPosition);

    this.lngLat = lngLat;
  }
}

class CubeLayer {
  constructor() {
    this.id = '3d-model';
    this.type = 'custom';
    this.renderingMode = '3d';

    this.camera = new Camera();
    this.group = new Group();
    this.scene = new Scene();
    this.scene.add(this.group);
  }

  addCube(cube) {
    if (!this.map) {
      throw new Error('Layer not added');
    }
    this.group.add(cube.mapMesh);
    this.map.triggerRepaint();
  }

  onAdd(map, gl) {
    this.map = map;
    this.renderer = new WebGLRenderer({
      canvas: map.getCanvas(),
      context: gl,
      antialias: true,
    });
    this.renderer.autoClear = false;
  }

  render(gl, matrix) {
    if (!this.group.children.length) {
      return;
    }

    const {transform} = this;
    const rotationX = new Matrix4().makeRotationAxis(
      new Vector3(1, 0, 0),
      transform.rotateX,
    );
    const rotationY = new Matrix4().makeRotationAxis(
      new Vector3(0, 1, 0),
      transform.rotateY,
    );
    const rotationZ = new Matrix4().makeRotationAxis(
      new Vector3(0, 0, 1),
      transform.rotateZ,
    );

    const m = new Matrix4().fromArray(matrix);
    const l = new Matrix4()
      .makeTranslation(
        transform.translateX,
        transform.translateY,
        transform.translateZ,
      )
      .scale(new Vector3(transform.scale, -transform.scale, transform.scale))
      .multiply(rotationX)
      .multiply(rotationY)
      .multiply(rotationZ);

    this.camera.projectionMatrix = m.multiply(l);
    this.renderer.resetState();
    this.renderer.render(this.scene, this.camera);
  }

  setReference(reference) {
    const altitude = 0;
    this.reference = {
      alt: altitude,
      lat: reference.lat,
      lng: reference.lng,
    };
    this.transform = makeMapTransform(reference, altitude);
  }
}

class CubeRenderer {
  constructor() {
    this.id = 'cube-renderer';
    this.renderPass = RenderPass.Opaque;

    this.scene = new Scene();
    this.camera = new Camera();
    this.camera.matrixAutoUpdate = false;
  }

  addCube(cube) {
    if (!this.reference) {
      throw new Error('Renderer not added');
    }
    this.scene.add(cube.viewerMesh);
    this.viewer.triggerRerender();
  }

  onAdd(viewer, reference, context) {
    this.reference = reference;
    this.viewer = viewer;

    const canvas = viewer.getCanvas();
    this.renderer = new WebGLRenderer({
      canvas,
      context,
    });
    this.renderer.autoClear = false;
  }

  onReference(viewer, reference) {
    this.reference = reference;
  }

  onRemove(_viewer, _context) {
    this.renderer.dispose();
  }

  render(context, viewMatrix, projectionMatrix) {
    const {camera, scene, renderer} = this;
    camera.matrix.fromArray(viewMatrix).invert();
    camera.updateMatrixWorld(true);
    camera.projectionMatrix.fromArray(projectionMatrix);

    renderer.resetState();
    renderer.render(scene, camera);
  }
}

let viewer;
let map;

export function init(opts) {
  const {accessToken, mapboxAccessToken, container} = opts;
  const imageId = '180590873926215';

  const containers = makeContainers(container);
  const viewerOptions = {
    accessToken,
    component: {
      cover: false,
    },
    container: containers.viewer,
  };
  const cubeRenderer = new CubeRenderer();
  viewer = new Viewer(viewerOptions);
  viewer.addCustomRenderer(cubeRenderer);
  viewer.moveTo(imageId).catch((error) => console.warn(error));

  mapboxgl.accessToken = mapboxAccessToken;
  map = new mapboxgl.Map({
    container: containers.map,
    style: 'mapbox://styles/mapbox/streets-v11',
    minZoom: 19,
    zoom: 20,
    center: [4.9144189674499, 52.356214723568],
    pitch: 60,
    antialias: true,
    doubleClickZoom: false,
  });

  const cubeLayer = new CubeLayer();
  const positionMarker = makeCircleMarker({radius: 8, color: '#f0f'}).setLngLat(
    [0, 0],
  );

  containers.map.appendChild(makeInstructions());

  const onImage = (image) => {
    const {lngLat} = image;
    if (!map.getBounds().contains(lngLat)) {
      map.setCenter(lngLat);
    }
  };

  const onPosition = async () => {
    const position = await viewer.getPosition();
    const pos = [position.lng, position.lat];
    positionMarker.setLngLat(pos);
  };

  const onCreateCube = (event) => {
    const {lngLat} = event;
    const {reference} = cubeRenderer;
    if (!lngLat || !reference) {
      return;
    }
    const cube = new Cube({lngLat, map, reference, viewer});
    cubeLayer.addCube(cube);
    cubeRenderer.addCube(cube);
    cube.rotator.addTo(map);
    cube.mover.addTo(map);
  };

  viewer.on('load', async () => {
    const image = await viewer.getImage();
    onImage(image);
    await onPosition();
    cubeLayer.setReference(image.lngLat);
  });
  viewer.on('image', (event) => onImage(event.image));
  viewer.on('position', onPosition);
  viewer.on('dblclick', onCreateCube);

  map.on('load', () => {
    positionMarker.addTo(map);
  });
  map.on('style.load', () => {
    map.addLayer(cubeLayer);
  });
  map.on('dblclick', onCreateCube);
}

export function dispose() {
  if (viewer) {
    viewer.remove();
  }
  if (map) {
    map.remove();
  }
}
