/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {
  BoxGeometry,
  BoxHelper,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Raycaster,
  Scene,
  Vector2,
  WebGLRenderer,
} from '../../../mods/three/build/three.module';

import {TransformControls} from '../../../mods/three/examples/jsm/controls/TransformControls';

import {
  enuToGeodetic,
  geodeticToEnu,
  RenderPass,
  Viewer,
} from '../../../mods/mapillary-js/dist/mapillary.module';

import {Log} from '../options/Log';

const RAD2DEG = 180 / Math.PI;

let log;

function canvasToViewport(canvasPoint, container) {
  const rect = container.getBoundingClientRect();
  const canvasWidth = rect.width;
  const canvasHeight = rect.height;
  const [canvasX, canvasY] = canvasPoint;
  const viewportX = (2 * canvasX) / canvasWidth - 1;
  const viewportY = 1 - (2 * canvasY) / canvasHeight;
  return [viewportX, viewportY];
}

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

function makeBoxMesh() {
  const geometry = new BoxGeometry(2, 2, 2);
  const materials = [
    new MeshBasicMaterial({
      color: 0xffff00,
      side: DoubleSide,
    }),
    new MeshBasicMaterial({
      color: 0xff00ff,
      side: DoubleSide,
    }),
    new MeshBasicMaterial({
      color: 0x00ff00,
      side: DoubleSide,
    }),
    new MeshBasicMaterial({
      color: 0x0000ff,
      side: DoubleSide,
    }),
    new MeshBasicMaterial({
      color: 0xffffff,
      side: DoubleSide,
    }),
    new MeshBasicMaterial({
      color: 0xff0000,
      side: DoubleSide,
    }),
  ];
  return new Mesh(geometry, materials);
}

class Toolbar {
  constructor(options) {
    this.controls = options.controls;
    this.viewer = options.viewer;

    this.container = document.createElement('div');
    this.container.classList.add('example-editor-toolbar');

    this.translate = this.makeButton('translate');
    this.translate.classList.add('selected');
    this.rotate = this.makeButton('rotate');
    this.scale = this.makeButton('scale');

    this.checkbox = document.createElement('input');
    this.checkbox.setAttribute('type', 'checkbox');
    this.checkbox.style.pointerEvents = 'none';
    this.space = document.createElement('div');
    this.space.classList.add('button-space');
    this.space.appendChild(this.checkbox);
    this.space.addEventListener('click', () => {
      this.checkbox.dispatchEvent(new MouseEvent('click', {bubbles: false}));
    });
    this.checkbox.addEventListener('change', (event) => {
      const space = event.target.checked ? 'local' : 'world';
      this.controls.setSpace(space);
      this.viewer.triggerRerender();
    });

    this.container.appendChild(this.translate);
    this.container.appendChild(this.rotate);
    this.container.appendChild(this.scale);
    this.container.appendChild(this.space);

    options.container.appendChild(this.container);
  }

  makeButton(mode) {
    const button = document.createElement('div');
    button.classList.add(`button-${mode}`);
    const icon = document.createElement('div');
    icon.classList.add(`icon-${mode}`);
    button.appendChild(icon);

    button.addEventListener('click', () => {
      this.container.childNodes.forEach((child) => {
        child.classList.remove('selected');
      });
      button.classList.add('selected');
      this.controls.setMode(mode);
      this.viewer.triggerRerender();
    });
    return button;
  }
}

class Transformer {
  constructor(options) {
    const {camera, viewer, reference} = options;

    this.reference = reference;

    const pointerComponent = viewer.getComponent('pointer');
    const keyboardComponent = viewer.getComponent('keyboard');

    this.selectionBox = new BoxHelper();
    this.selectionBox.material.depthTest = false;
    this.selectionBox.material.transparent = true;
    this.selectionBox.visible = false;

    this.controls = new TransformControls(camera, viewer.getContainer());

    this.controls.addEventListener('dragging-changed', (event) => {
      if (event.value) {
        pointerComponent.deactivate();
        keyboardComponent.deactivate();
      } else {
        pointerComponent.activate();
        keyboardComponent.activate();
      }
    });

    this.controls.addEventListener('change', () => {
      this.selectionBox.setFromObject(this.controls.object);
      viewer.triggerRerender();
    });

    this.controls.addEventListener('mouseUp', (event) => {
      const {mode} = event;
      switch (mode) {
        case 'translate':
          {
            const [e, n, u] = this.controls.object.position.toArray();
            const ref = this.reference;
            const [lng, lat, alt] = enuToGeodetic(
              e,
              n,
              u,
              ref.lng,
              ref.lat,
              ref.alt,
            );
            this.controls.object.geoPosition = {alt, lat, lng};
            log.add(`'${mode}' - lng: ${lng.toFixed(7)}`);
            log.add(`'${mode}' - lat: ${lat.toFixed(7)}`);
            log.add(`'${mode}' - alt: ${alt.toFixed(2)}`);
          }
          break;
        case 'rotate':
          {
            const [rx, ry, rz, order] = this.controls.object.rotation.toArray();
            const dx = (RAD2DEG * rx).toFixed(1);
            const dy = (RAD2DEG * ry).toFixed(1);
            const dz = (RAD2DEG * rz).toFixed(1);
            log.add(`'${mode}' - [${dx}, ${dy}, ${dz}] ${order}`);
          }
          break;
        case 'scale':
          {
            const [sx, sy, sz] = this.controls.object.scale.toArray();
            const fsx = sx.toFixed(2);
            const fsy = sy.toFixed(2);
            const fsz = sz.toFixed(2);
            log.add(`'${mode}' - [${fsx}, ${fsy}, ${fsz}]`);
          }
          break;
        default:
          break;
      }
    });
  }

  attach(object) {
    this.selectionBox.visible = false;
    this.controls.detach();
    if (object) {
      this.selectionBox.setFromObject(object);
      this.selectionBox.visible = true;
      this.controls.attach(object);
    }
  }

  onReference(reference) {
    this.reference = reference;
    if (this.controls.object) {
      this.selectionBox.setFromObject(this.controls.object);
    }
  }
}

export class TransformBoxRenderer {
  constructor(box) {
    this.id = 'transform-renderer';
    this.renderPass = RenderPass.Opaque;

    this.raycaster = new Raycaster();
    this.pointer = new Vector2();

    this.box = box;
  }

  onAdd(viewer, reference, context) {
    this.viewer = viewer;
    this.reference = reference;

    const position = geoToPosition(this.box.geoPosition, reference);
    this.box.mesh.position.fromArray(position);

    const canvas = viewer.getCanvas();
    this.renderer = new WebGLRenderer({
      canvas,
      context,
    });
    this.renderer.autoClear = false;

    this.camera = new PerspectiveCamera(90, 1, 1e-1, 1e3);
    this.camera.rotateX(Math.PI / 2);
    this.camera.matrixAutoUpdate = false;

    this.scene = new Scene();
    this.scene.add(this.box.mesh);

    this.transformer = new Transformer({
      camera: this.camera,
      reference,
      viewer,
    });

    this.scene.add(this.transformer.controls);
    this.scene.add(this.transformer.selectionBox);

    this.toolbar = new Toolbar({
      container: viewer.getContainer(),
      controls: this.transformer.controls,
      viewer,
    });
  }

  onReference(viewer, reference) {
    const position = geoToPosition(this.box.geoPosition, reference);
    this.box.mesh.position.fromArray(position);
    this.transformer.onReference(reference);
  }

  onRemove(_viewer, _context) {
    this.box.mesh.geometry.dispose();
    this.box.mesh.material.forEach((m) => m.dispose());
    this.renderer.dispose();
    this.transformer.controls.dispose();
  }

  render(context, viewMatrix, projectionMatrix) {
    const {camera, scene, renderer} = this;
    camera.matrix.fromArray(viewMatrix).invert();
    camera.updateMatrixWorld(true);
    camera.projectionMatrix.fromArray(projectionMatrix);

    renderer.resetState();
    renderer.render(scene, camera);
  }

  select(pixelPoint) {
    if (!this.camera) {
      return;
    }

    const {camera, box, pointer, raycaster, renderer} = this;

    const canvas = renderer.domElement;
    const [viewportX, viewportY] = canvasToViewport(pixelPoint, canvas);
    pointer.set(viewportX, viewportY);

    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
    raycaster.setFromCamera(pointer, camera);

    const intersections = raycaster.intersectObject(box.mesh);
    if (intersections.length) {
      this.transformer.attach(intersections[0].object);
    } else {
      this.transformer.attach();
    }

    this.viewer.triggerRerender();
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

  const box = {
    geoPosition: {
      alt: 1,
      lat: -25.28268614514251,
      lng: -57.630922858385,
    },
    mesh: makeBoxMesh(),
  };
  const transformRenderer = new TransformBoxRenderer(box);
  viewer.addCustomRenderer(transformRenderer);

  viewer.moveTo(imageId).catch((error) => console.error(error));

  log = new Log({
    container,
    header: 'Box Transforms (last 30 seconds)',
    timeout: 30,
  });

  viewer.on('click', (event) => transformRenderer.select(event.pixelPoint));
}

export function dispose() {
  if (viewer) {
    viewer.remove();
  }
  if (log) {
    log.clear();
  }
}
