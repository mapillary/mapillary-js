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
  Mesh,
  MeshBasicMaterial,
  Scene,
  WebGLRenderer,
} from '../../../mods/three/build/three.module';

function geoToPosition(geoPosition, reference) {
  const enuPosition = geodeticToEnu(
    geoPosition.lng,
    geoPosition.lat,
    geoPosition.alt,
    reference.lng,
    reference.lat,
    reference.alt,
  );
  return enuPosition;
}

function makeCubeMesh() {
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
  return new Mesh(geometry, materials);
}

export class ThreeCubeRenderer {
  constructor(cube) {
    this.id = 'three-cube-renderer';
    this.renderPass = RenderPass.Opaque;
    this.cube = cube;
  }

  onAdd(viewer, reference, context) {
    const position = geoToPosition(this.cube.geoPosition, reference);
    this.cube.mesh.position.fromArray(position);

    const canvas = viewer.getCanvas();
    this.renderer = new WebGLRenderer({
      canvas,
      context,
    });
    this.renderer.autoClear = false;

    this.camera = new Camera();
    this.camera.matrixAutoUpdate = false;

    this.scene = new Scene();
    this.scene.add(this.cube.mesh);
  }

  onReference(viewer, reference) {
    const position = geoToPosition(this.cube.geoPosition, reference);
    this.cube.mesh.position.fromArray(position);
  }

  onRemove(_viewer, _context) {
    this.cube.mesh.geometry.dispose();
    this.cube.mesh.material.forEach((m) => m.dispose());
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

export function init(opts) {
  const {accessToken, container} = opts;

  const imageId = '3748064795322267';
  const options = {
    accessToken,
    component: {cover: false},
    container,
  };
  viewer = new Viewer(options);

  const cube = {
    geoPosition: {
      alt: 1,
      lat: -25.28268614514251,
      lng: -57.630922858385,
    },
    mesh: makeCubeMesh(),
  };
  const cubeRenderer = new ThreeCubeRenderer(cube);
  viewer.addCustomRenderer(cubeRenderer);

  viewer.moveTo(imageId).catch((error) => console.error(error));
}

export function dispose() {
  if (viewer) {
    viewer.remove();
  }
}
