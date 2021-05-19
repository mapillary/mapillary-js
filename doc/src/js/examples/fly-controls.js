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

function calcAspect(element) {
  const width = element.offsetWidth;
  const height = element.offsetHeight;
  return width === 0 || height === 0 ? 0 : width / height;
}

export class FlyCameraControls {
  constructor(options) {
    this.fov = options.fov;
    this.movementSpeed = options.movementSpeed;
    this.rollSpeed = options.rollSpeed;
  }

  onActivate(viewer, viewMatrix, projectionMatrix, reference) {
    this.reference = reference;

    const {fov, movementSpeed, rollSpeed} = this;

    const container = viewer.getContainer();
    const aspect = calcAspect(container);
    const camera = new PerspectiveCamera(fov, aspect, 0.1, 10000);
    camera.rotateX(Math.PI / 2);

    this.controls = new FlyControls(camera, container);
    this.controls.movementSpeed = movementSpeed;
    this.controls.rollSpeed = rollSpeed;

    const viewMatrixInverse = new Matrix4().fromArray(viewMatrix).invert();
    const me = viewMatrixInverse.elements;
    const translation = [me[12], me[13], me[14]];
    this.controls.object.position.fromArray(translation);

    this.onControlsChange = () => {
      this.controls.object.updateMatrixWorld(true);
      this.viewMatrixCallback(
        this.controls.object.matrixWorldInverse.toArray(),
      );
    };
    this.controls.addEventListener('change', this.onControlsChange);

    this.clock = new Clock();
    const delta = this.clock.getDelta();
    this.controls.update(delta);

    this.updateProjectionMatrix();
  }

  onAnimationFrame(_viewer, _frameId) {
    const delta = this.clock.getDelta();
    this.controls.update(delta);
  }

  onAttach(viewer, viewMatrixCallback, projectionMatrixCallback) {
    this.viewMatrixCallback = viewMatrixCallback;
    this.projectionMatrixCallback = projectionMatrixCallback;
  }

  onDeactivate(_viewer) {
    if (this.controls) {
      this.controls.removeEventListener('change', this.onControlsChange);
      this.controls.dispose();
      this.controls = null;
    }
  }

  onDetach(_viewer) {
    this.projectionMatrixCallback = null;
    this.viewMatrixCallback = null;
  }

  onReference(viewer, reference) {
    const oldReference = this.reference;

    const enu = this.controls.object.position;
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

    this.controls.object.position.set(e, n, u);
    this.controls.object.updateMatrixWorld(true);

    this.reference = reference;
  }

  onResize(_viewer) {
    this.updateProjectionMatrix();
  }

  updateProjectionMatrix() {
    const camera = this.controls.object;
    camera.aspect = calcAspect(this.controls.domElement);
    camera.updateProjectionMatrix();
    this.projectionMatrixCallback(camera.projectionMatrix.toArray());
  }
}

let viewer;

export function init(opts) {
  const {appToken, container} = opts;
  const options = {
    apiClient: appToken,
    cameraControls: CameraControls.Custom,
    component: {
      cover: false,
      direction: false,
      spatial: {cameraSize: 0.8, cellsVisible: true, pointSize: 0.2},
    },
    container,
  };
  viewer = new Viewer(options);

  const flyOptions = {
    fov: 90,
    movementSpeed: 30,
    rollSpeed: 0.25,
  };
  const flyControls = new FlyCameraControls(flyOptions);
  viewer.attachCustomCameraControls(flyControls);

  viewer.moveTo('lKiLKEpwHq6zs1kTywTbY6').catch((error) => console.warn(error));
}

export function dispose() {
  if (viewer) {
    viewer.remove();
  }
}
