/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {
  geodeticToEnu,
  RenderPass,
  Viewer,
} from '../../../mods/mapillary-js/dist/mapillary.module';
import {
  BoxGeometry,
  Camera,
  Clock,
  Mesh,
  MeshBasicMaterial,
  Scene,
  WebGLRenderer,
} from '../../../mods/three/build/three.module';

function makePosition(geoPosition, reference) {
  const position = geodeticToEnu(
    geoPosition.lng,
    geoPosition.lat,
    geoPosition.alt,
    reference.lng,
    reference.lat,
    reference.alt,
  );
  return position;
}

class RotatingCubeRenderer {
  constructor() {
    this.id = 'rotating-cube-renderer';
    this.renderPass = RenderPass.Opaque;
    this.clock = new Clock();
    this.cubeGeoPosition = {
      alt: 1,
      lat: -25.28268614514251,
      lng: -57.630922858385,
    };
  }

  onAdd(viewer, reference, context) {
    const {cubeGeoPosition} = this;
    const position = makePosition(cubeGeoPosition, reference);

    const canvas = viewer.getCanvas();
    const renderer = new WebGLRenderer({
      canvas,
      context,
    });
    renderer.autoClear = false;

    const scene = new Scene();
    const camera = new Camera();
    camera.matrixAutoUpdate = false;

    const geometry = new BoxGeometry(2, 2, 2);
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
    const sphere = new Mesh(geometry, materials);
    sphere.position.fromArray(position);
    scene.add(sphere);

    this.camera = camera;
    this.scene = scene;
    this.sphere = sphere;
    this.renderer = renderer;
    this.viewer = viewer;
  }

  onReference(viewer, reference) {
    const {cubeGeoPosition, sphere} = this;
    const position = makePosition(cubeGeoPosition, reference);
    sphere.position.fromArray(position);
  }

  onRemove(_viewer, _context) {
    this.sphere.geometry.dispose();
    this.sphere.material.forEach((m) => m.dispose());
    this.renderer.dispose();
  }

  render(context, viewMatrix, projectionMatrix) {
    const {camera, clock, scene, sphere, renderer, viewer} = this;

    const delta = clock.getDelta();

    sphere.rotateZ(delta);
    sphere.rotateY(0.7 * delta);

    camera.matrix.fromArray(viewMatrix).invert();
    camera.updateMatrixWorld(true);
    camera.projectionMatrix.fromArray(projectionMatrix);

    renderer.resetState();
    renderer.render(scene, camera);

    viewer.triggerRerender();
  }
}

let viewer;

export function init(opts) {
  const {appToken, container} = opts;
  const options = {
    apiClient: appToken,
    component: {cover: false},
    container,
  };

  viewer = new Viewer(options);
  viewer.addCustomRenderer(new RotatingCubeRenderer());

  viewer
    .moveTo('H_g2NFQvEXdGGyTjY27FMA')
    .catch((error) => console.error(error));
}

export function dispose() {
  if (viewer) {
    viewer.remove();
  }
}
