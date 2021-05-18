/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {
  enuToGeodetic,
  geodeticToEnu,
  CameraControls,
  Viewer,
} from '../../../mods/mapillary-js/dist/mapillary.module';
import {
  Clock,
  Matrix4,
  PerspectiveCamera,
} from '../../../mods/three/build/three.module';
import {FlyControls} from '../../../mods/three/examples/jsm/controls/FlyControls';

const FOV = 90;

function calcAspect(element) {
  const width = element.offsetWidth;
  const height = element.offsetHeight;
  return width === 0 || height === 0 ? 0 : width / height;
}

export class FlyCameraControls {
  constructor() {
    this._controls = null;
    this._reference = null;
    this._projectionMatrixCallback = null;
    this._viewMatrixCallback = null;
    this._clock = null;
  }

  onActivate(viewer, viewMatrix, projectionMatrix, reference) {
    this._reference = reference;

    const container = viewer.getContainer();
    const aspect = calcAspect(container);
    const camera = new PerspectiveCamera(FOV, aspect, 0.1, 10000);
    camera.rotateX(Math.PI / 2);

    const controls = new FlyControls(camera, container);
    controls.movementSpeed = 30;
    controls.rollSpeed = 0.25;
    this._controls = controls;

    const viewMatrixInverse = new Matrix4().fromArray(viewMatrix).invert();
    const me = viewMatrixInverse.elements;
    const translation = [me[12], me[13], me[14]];
    controls.object.position.fromArray(translation);

    this._clock = new Clock();

    this._updateViewMatrix();
    this._updateProjectionMatrix();
  }

  onAnimationFrame(_viewer, _frameId) {
    this._updateViewMatrix();
  }

  onAttach(viewer, viewMatrixCallback, projectionMatrixCallback) {
    this._viewMatrixCallback = viewMatrixCallback;
    this._projectionMatrixCallback = projectionMatrixCallback;
  }

  onDeactivate(_viewer) {
    this._controls.dispose();
    this._controls = null;
  }

  onDetach(_viewer) {
    this._projectionMatrixCallback = null;
    this._viewMatrixCallback = null;
  }

  onReference(viewer, reference) {
    const oldReference = this._reference;

    const enu = this._controls.object.position;
    const [lng, lat, alt] = enuToGeodetic(
      enu.x,
      enu.y,
      enu.z,
      oldReference.lng,
      oldReference.lat,
      oldReference.alt,
    );
    const [e, n, u] = geodeticToEnu(
      lng,
      lat,
      alt,
      reference.lng,
      reference.lat,
      reference.alt,
    );

    this._controls.object.position.set(e, n, u);
    this._controls.object.updateMatrixWorld(true);

    this._reference = reference;
  }

  onResize(_viewer) {
    this._updateProjectionMatrix();
  }

  _updateProjectionMatrix() {
    const camera = this._controls.object;
    camera.aspect = calcAspect(this._controls.domElement);
    camera.updateProjectionMatrix();
    this._projectionMatrixCallback(camera.projectionMatrix.toArray());
  }

  _updateViewMatrix() {
    const delta = this._clock.getDelta();
    this._controls.update(delta);
    this._controls.object.updateMatrixWorld(true);
    this._viewMatrixCallback(
      this._controls.object.matrixWorldInverse.toArray(),
    );
  }
}

let viewer;

export function init(opts) {
  const {appToken, container} = opts;
  const options = {
    apiClient: appToken,
    cameraControls: CameraControls.Custom,
    component: {cover: false, spatial: {cellsVisible: true}},
    container,
  };

  viewer = new Viewer(options);
  viewer.attachCustomCameraControls(new FlyCameraControls());

  viewer
    .moveTo('ie9ktAVyhibDCD_V0m6apQ')
    .catch((error) => console.error(error));
}

export function dispose() {
  if (viewer) {
    viewer.remove();
  }
}
