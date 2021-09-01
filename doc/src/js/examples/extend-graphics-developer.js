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
  RenderPass,
  Viewer,
} from '../../mapillary-js/dist/mapillary.module';

const CONE_GEO_ANCHOR = {
  alt: 1.8,
  lat: 60.2080842,
  lng: 5.5363649999722,
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
  const geometry = new ConeGeometry(1, 3, 8);
  const material = new MeshPhongMaterial({
    color: 0xffff00,
  });
  return new Mesh(geometry, material);
}

function makeContainer(parent) {
  const container = document.createElement('div');
  container.style.width = 'calc(50% - 2px)';
  container.style.height = 'calc(100% - 2px)';
  container.style.display = 'inline-block';
  container.style.margin = '1px';
  parent.appendChild(container);
  return container;
}

/* eslint-disable class-methods-use-this */

export class ConeRenderer {
  constructor(id) {
    this.id = id;
    this.renderPass = RenderPass.Opaque;
  }

  makeCone() {
    throw new Error('Not implemented');
  }

  makeMatrix(_viewMatrix) {
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

    this.camera = new Camera();
    this.camera.matrixAutoUpdate = false;

    this.scene = new Scene();
    this.scene.add(new AmbientLight(0xffffff, 0.3));

    this.makeCone(viewer, reference, context);
  }

  onReference(_viewer, _reference) {
    throw new Error('Not implemented');
  }

  onRemove(_viewer, _context) {
    this.cone.geometry.dispose();
    this.cone.material.dispose();
    this.renderer.dispose();
  }

  render(context, viewMatrix, projectionMatrix) {
    const {camera, scene, renderer} = this;

    const matrix = this.makeMatrix(viewMatrix);
    camera.matrix.copy(matrix);
    camera.updateMatrixWorld(true);
    camera.projectionMatrix.fromArray(projectionMatrix);

    renderer.resetState();
    renderer.render(scene, camera);
  }
}

export class ThreeToMapillaryRenderer extends ConeRenderer {
  makeCone(viewer, reference) {
    this.cone = makeCone();
    this.cone.position.copy(this.makePosition(reference));
    this.cone.rotation.setFromRotationMatrix(THREE_TO_MAPILLARY_TRANSFORM);

    const translation = new Vector3(0, 0, -6).applyMatrix4(
      THREE_TO_MAPILLARY_TRANSFORM,
    );
    this.cone.position.add(translation);
    this.scene.add(this.cone);

    const light = new DirectionalLight(0xffffff, 0.7);
    const position = new Vector3(0, 1, 1).applyMatrix4(
      THREE_TO_MAPILLARY_TRANSFORM,
    );
    light.position.copy(position);

    this.scene.add(light);
  }

  makeMatrix(viewMatrix) {
    return new Matrix4().fromArray(viewMatrix).invert();
  }

  makePosition(reference) {
    return new Vector3().fromArray(
      geoToTopocentric(CONE_GEO_ANCHOR, reference),
    );
  }

  onReference(viewer, reference) {
    this.cone.position.copy(this.makePosition(reference));
  }
}

export class MapillaryToThreeRenderer extends ConeRenderer {
  makeCone(viewer, reference) {
    this.cone = makeCone();
    this.cone.position.copy(this.makePosition(reference));

    const translation = new Vector3(0, 0, -6);
    this.cone.position.add(translation);
    this.scene.add(this.cone);

    const light = new DirectionalLight(0xffffff, 0.7);
    light.position.set(0, 1, 1);
    this.scene.add(light);
  }

  makeMatrix(viewMatrix) {
    return MAPILLARY_TO_THREE_TRANSFORM.clone().multiply(
      new Matrix4().fromArray(viewMatrix).invert(),
    );
  }

  makePosition(reference) {
    const [x, y, z] = geoToTopocentric(CONE_GEO_ANCHOR, reference);
    return new Vector3(x, y, z).applyMatrix4(MAPILLARY_TO_THREE_TRANSFORM);
  }

  onReference(viewer, reference) {
    const [x, y, z] = geoToTopocentric(CONE_GEO_ANCHOR, reference);
    const position = new Vector3(x, y, z).applyMatrix4(
      MAPILLARY_TO_THREE_TRANSFORM,
    );
    this.cone.position.copy(position);
  }
}

/* eslint-enable class-methods-use-this */

let tmViewer;
let mtViewer;

export function init(opts) {
  const {accessToken, container} = opts;
  const imageId = '238134374861518';

  // Transform Three coordinates to align with Mapillary
  tmViewer = new Viewer({
    accessToken,
    container: makeContainer(container),
  });
  const tmRenderer = new ThreeToMapillaryRenderer();
  tmViewer.addCustomRenderer(tmRenderer);
  tmViewer.moveTo(imageId).catch((error) => console.error(error));

  // Transform Mapillary coordinates to align with Three
  mtViewer = new Viewer({
    accessToken,
    container: makeContainer(container),
  });
  const mtRenderer = new MapillaryToThreeRenderer();
  mtViewer.addCustomRenderer(mtRenderer);
  mtViewer.moveTo(imageId).catch((error) => console.error(error));
}

export function dispose() {
  if (tmViewer) {
    tmViewer.remove();
  }
  if (mtViewer) {
    mtViewer.remove();
  }
}
