/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {
  AmbientLight,
  Camera,
  ConeGeometry,
  DirectionalLight,
  Euler,
  Matrix4,
  Mesh,
  MeshPhongMaterial,
  Scene,
  Vector3,
  WebGLRenderer,
} from 'three';

import {
  geodeticToEnu,
  CameraControls,
  RenderPass,
  Viewer,
} from '../../mapillary-js/dist/mapillary.module';

import {
  DEFAULT_REFERENCE,
  ProceduralDataProvider,
} from '../utils/ProceduralDataProvider';

const CONE_GEO_ANCHOR = {
  lng: DEFAULT_REFERENCE.lng,
  lat: DEFAULT_REFERENCE.lat,
  alt: DEFAULT_REFERENCE.alt,
};

const THREE_TO_MAPILLARY_TRANSFORM = new Matrix4().makeRotationFromEuler(
  new Euler(Math.PI / 2, 0, 0),
);

const MAPILLARY_TO_THREE_TRANSFORM = new Matrix4().makeRotationFromEuler(
  new Euler(-Math.PI / 2, 0, 0),
);

function geoToTopocentric(geoAnchor, reference) {
  const topocentric = geodeticToEnu(
    geoAnchor.lng,
    geoAnchor.lat,
    geoAnchor.alt,
    reference.lng,
    reference.lat,
    reference.alt,
  );

  return topocentric;
}

function makeCone() {
  const geometry = new ConeGeometry(2, 6, 8);
  const material = new MeshPhongMaterial({
    color: 0xffff00,
  });
  return new Mesh(geometry, material);
}

function makeContainer(parent) {
  const container = document.createElement('div');
  container.style.width = 'calc(33.33% - 2px)';
  container.style.height = 'calc(100% - 2px)';
  container.style.display = 'inline-block';
  container.style.margin = '1px';
  parent.appendChild(container);
  return container;
}

export function makeViewerOptions(options) {
  const {container, dataProvider} = options;
  return {
    cameraControls: CameraControls.Earth,
    component: {
      cover: false,
      spatial: {cameraSize: 0.5, cellGridDepth: 3, cellsVisible: true},
      zoom: false,
    },
    container,
    dataProvider,
    imageTiling: false,
  };
}

/* eslint-disable class-methods-use-this */

export class ConeRenderer {
  constructor(options) {
    const {translation} = options;

    this.id = 'cone-renderer';
    this.renderPass = RenderPass.Opaque;

    this.coneTranslation = new Vector3().fromArray(translation);
    this.lightPosition = new Vector3(0, 1, 1);

    this.scene = new Scene();

    this.cone = makeCone();
    this.scene.add(this.cone);

    this.directional = new DirectionalLight(0xffffff, 0.7);
    this.scene.add(this.directional);
    this.scene.add(new AmbientLight(0xffffff, 0.3));

    this.camera = new Camera();
    this.camera.matrixAutoUpdate = false;
  }

  makeMatrix(_viewMatrix) {
    throw new Error('Not implemented');
  }

  makePose(_reference, _originalRotation) {
    throw new Error('Not implemented');
  }

  onAdd(viewer, reference, context) {
    this.viewer = viewer;

    const canvas = viewer.getCanvas();
    this.renderer = new WebGLRenderer({
      canvas,
      context,
    });
    this.renderer.autoClear = false;

    this.setPose(viewer, reference, context);
  }

  onReference(_viewer, reference) {
    const {position, rotation} = this.makePose(reference, this.cone.rotation);
    this.cone.position.copy(position);
    this.cone.rotation.copy(rotation);
  }

  onRemove(_viewer, _context) {
    this.cone.geometry.dispose();
    this.cone.material.dispose();
    this.renderer.dispose();
  }

  render(_context, viewMatrix, projectionMatrix) {
    const {camera, scene, renderer} = this;

    const matrix = this.makeMatrix(viewMatrix);
    camera.matrix.copy(matrix);
    camera.updateMatrixWorld(true);
    camera.projectionMatrix.fromArray(projectionMatrix);

    renderer.resetState();
    renderer.render(scene, camera);
  }

  setPose(_reference) {
    throw new Error('Not implemented');
  }
}

export class RawRenderer extends ConeRenderer {
  constructor(options) {
    super(options);
    this.id = 'raw-renderer';
  }

  makeMatrix(viewMatrix) {
    return new Matrix4().fromArray(viewMatrix).invert();
  }

  makePose(reference, originalRotation) {
    const position = new Vector3().fromArray(
      geoToTopocentric(CONE_GEO_ANCHOR, reference),
    );
    const translation = this.coneTranslation.clone();
    position.add(translation);

    const rotation = new Euler().copy(originalRotation);
    return {position, rotation};
  }

  setPose(_viewer, reference) {
    const {position, rotation} = this.makePose(reference, this.cone.rotation);
    this.cone.position.copy(position);
    this.cone.rotation.copy(rotation);

    this.directional.position.copy(this.lightPosition);
  }
}

export class ThreeToMapillaryRenderer extends ConeRenderer {
  constructor(options) {
    super(options);
    this.id = 'three-to-mapillary-renderer';
  }

  makeMatrix(viewMatrix) {
    return new Matrix4().fromArray(viewMatrix).invert();
  }

  makePose(reference, originalRotation) {
    const [x, y, z] = geoToTopocentric(CONE_GEO_ANCHOR, reference);
    const position = new Vector3(x, y, z);
    const translation = this.coneTranslation
      .clone()
      .applyMatrix4(THREE_TO_MAPILLARY_TRANSFORM);
    position.add(translation);

    const rotationMatrix = THREE_TO_MAPILLARY_TRANSFORM.clone().multiply(
      new Matrix4().makeRotationFromEuler(originalRotation),
    );
    const rotation = new Euler().setFromRotationMatrix(rotationMatrix);

    return {position, rotation};
  }

  setPose(_viewer, reference) {
    const {position, rotation} = this.makePose(reference, this.cone.rotation);
    this.cone.position.copy(position);
    this.cone.rotation.copy(rotation);

    this.directional.position.copy(
      this.lightPosition.clone().applyMatrix4(THREE_TO_MAPILLARY_TRANSFORM),
    );
  }
}

export class MapillaryToThreeRenderer extends ConeRenderer {
  constructor(options) {
    super(options);
    this.id = 'mapillary-to-three-renderer';
  }

  makeMatrix(viewMatrix) {
    return MAPILLARY_TO_THREE_TRANSFORM.clone().multiply(
      new Matrix4().fromArray(viewMatrix).invert(),
    );
  }

  makePose(reference, originalRotation) {
    const [x, y, z] = geoToTopocentric(CONE_GEO_ANCHOR, reference);
    const position = new Vector3(x, y, z).applyMatrix4(
      MAPILLARY_TO_THREE_TRANSFORM,
    );

    position.add(this.coneTranslation);

    const rotation = new Euler().copy(originalRotation);

    return {position, rotation};
  }

  setPose(_viewer, reference) {
    const {position, rotation} = this.makePose(reference, this.cone.rotation);
    this.cone.position.copy(position);
    this.cone.rotation.copy(rotation);

    this.directional.position.copy(this.lightPosition);
  }
}

/* eslint-enable class-methods-use-this */

function createViewer(options) {
  const {accessToken, container} = options;
  return new Viewer({
    accessToken,
    cameraControls: CameraControls.Earth,
    component: {spatial: {cellsVisible: true}},
    container: makeContainer(container),
    dataProvider: new ProceduralDataProvider({intervals: 2}),
    imageTiling: false,
  });
}

let rawViewer;
let tmViewer;
let mtViewer;

export function init(opts) {
  const {accessToken, container} = opts;
  const imageId = 'image|fisheye|0';
  const translation = [0, 5, 0];

  // Apply no transform
  rawViewer = createViewer({accessToken, container});
  rawViewer.addCustomRenderer(new RawRenderer({translation}));
  rawViewer.moveTo(imageId).catch((error) => console.error(error));

  // Transform Three coordinates to align with Mapillary
  tmViewer = createViewer({accessToken, container});
  tmViewer.addCustomRenderer(new ThreeToMapillaryRenderer({translation}));
  tmViewer.moveTo(imageId).catch((error) => console.error(error));

  // Transform Mapillary coordinates to align with Three
  mtViewer = createViewer({accessToken, container});
  mtViewer.addCustomRenderer(new MapillaryToThreeRenderer({translation}));
  mtViewer.moveTo(imageId).catch((error) => console.error(error));
}

export function dispose() {
  if (rawViewer) {
    rawViewer.remove();
  }
  if (tmViewer) {
    tmViewer.remove();
  }
  if (mtViewer) {
    mtViewer.remove();
  }
}
