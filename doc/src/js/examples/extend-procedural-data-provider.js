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
  CameraControls,
  DataProviderBase,
  S2GeometryProvider,
  Viewer,
} from '../../mapillary-js/dist/mapillary.module';

const ASPECT_FISHEYE = 3 / 2;
const ASPECT_PERSPECTIVE = 4 / 3;
const ASPECT_SPHERICAL = 2;

const FISHEYE = 'fisheye';
const PERSPECTIVE = 'perspective';
const SPHERICAL = 'spherical';

const REFERENCE = {alt: 10, lat: 15, lng: 20};

function cameraTypeToAspect(cameraType) {
  switch (cameraType) {
    case FISHEYE:
      return ASPECT_FISHEYE;
    case PERSPECTIVE:
      return ASPECT_PERSPECTIVE;
    case SPHERICAL:
      return ASPECT_SPHERICAL;
    default:
      throw new Error(`Camera type ${cameraType} not supported`);
  }
}

function generateCells(images, geometryProvider) {
  const cells = new Map();
  for (const image of images) {
    const cellId = geometryProvider.lngLatToCellId(image.geometry);
    if (!cells.has(cellId)) {
      cells.set(cellId, []);
    }
    cells.get(cellId).push(image);
  }
  return cells;
}

function generateCluster(options, intervals) {
  const {cameraType, east, focal, height, k1, k2, width} = options;
  const {alt, lat, lng} = REFERENCE;

  const distance = 5;

  const images = [];
  const thumbUrl = `${cameraType}`;
  const clusterId = `cluster|${cameraType}`;
  const sequenceId = `sequence|${cameraType}`;
  const sequence = {id: sequenceId, image_ids: []};

  for (let i = 0; i <= intervals; i++) {
    const imageId = `image|${cameraType}|${i}`;
    const thumbId = `thumb|${cameraType}|${i}`;
    const meshId = `mesh|${cameraType}|${i}`;
    sequence.image_ids.push(imageId);

    const north = (-intervals * distance) / 2 + distance * i;
    const up = 0;
    const [computedLng, computedLat, computedAlt] = enuToGeodetic(
      east,
      north,
      up,
      lng,
      lat,
      alt,
    );
    const computedGeometry = {lat: computedLat, lng: computedLng};
    const rotation = [Math.PI / 2, 0, 0];
    const compassAngle = 0;
    const cameraParameters = cameraType === SPHERICAL ? [] : [focal, k1, k2];

    images.push({
      altitude: computedAlt,
      atomic_scale: 1,
      camera_parameters: cameraParameters,
      camera_type: cameraType,
      captured_at: 0,
      cluster: {id: clusterId, url: clusterId},
      computed_rotation: rotation,
      compass_angle: compassAngle,
      computed_compass_angle: compassAngle,
      computed_altitude: computedAlt,
      computed_geometry: computedGeometry,
      creator: {id: null, username: null},
      geometry: computedGeometry,
      height,
      id: imageId,
      merge_id: 'merge_id',
      mesh: {id: meshId, url: meshId},
      exif_orientation: 1,
      private: null,
      quality_score: 1,
      sequence: {id: sequenceId},
      thumb: {id: thumbId, url: thumbUrl},
      owner: {id: null},
      width,
    });
  }

  return {images, sequence};
}

function generateClusters(options) {
  const {height, intervals} = options;
  const images = [];
  const sequences = [];

  const clusterConfigs = [
    {
      cameraType: FISHEYE,
      east: 9,
      focal: 0.45,
      k1: -0.006,
      k2: 0.004,
    },
    {
      cameraType: PERSPECTIVE,
      east: -9,
      focal: 0.8,
      k1: -0.13,
      k2: 0.07,
    },
    {
      cameraType: SPHERICAL,
      east: 0,
    },
  ];

  for (const config of clusterConfigs) {
    const aspect = cameraTypeToAspect(config.cameraType);
    config.width = aspect * height;
    config.height = height;
    const cluster = generateCluster(config, intervals);
    images.push(...cluster.images);
    sequences.push(cluster.sequence);
  }

  return {
    images: new Map(images.map((i) => [i.id, i])),
    sequences: new Map(sequences.map((s) => [s.id, s])),
  };
}

export function generateImageBuffer(options) {
  const {tilesY, tilesX, tileSize} = options;
  const w = tileSize;
  const h = tileSize;
  const canvas = document.createElement('canvas');
  canvas.width = w * tilesX;
  canvas.height = h * tilesY;
  const ctx = canvas.getContext('2d');

  for (let y = tilesY - 1; y >= 0; y--) {
    for (let x = 0; x < tilesX; x++) {
      const r = Math.floor((255 * x) / (tilesX - 1));
      const g = Math.floor((255 * (tilesY - 1 - y)) / (tilesY - 1));
      const b = 0;
      ctx.fillStyle = `rgb(${r} ${g} ${b})`;
      ctx.fillRect(w * x, h * y, w, h);
    }
  }

  return new Promise((resolve) => {
    canvas.toBlob(
      async (blob) => {
        const buffer = await blob.arrayBuffer();
        resolve(buffer);
      },
      'image/jpeg',
      1,
    );
  });
}

function getImageBuffer(options) {
  const {tileSize, tilesY, url} = options;
  const aspect = cameraTypeToAspect(url);
  return generateImageBuffer({
    tileSize,
    tilesX: aspect * tilesY,
    tilesY,
  });
}

export class ProceduralDataProvider extends DataProviderBase {
  constructor(options) {
    super(options.geometry ?? new S2GeometryProvider());

    this.imageTileSize = 10;
    this.imageTilesY = 10;

    const clusters = generateClusters({
      height: this.imageTileSize * this.imageTilesY,
      intervals: options.intervals ?? 10,
    });
    this.sequences = clusters.sequences;
    this.images = clusters.images;
    this.cells = generateCells(this.images.values(), this._geometry);
    this.clusters = new Map();
    this.meshes = new Map();
  }

  getCluster(url) {
    const cluster = this.clusters.has(url)
      ? this.clusters.get(url)
      : {points: {}, reference: REFERENCE};
    return Promise.resolve(cluster);
  }

  getCoreImages(cellId) {
    const images = this.cells.has(cellId) ? this.cells.get(cellId) : [];
    return Promise.resolve({cell_id: cellId, images});
  }

  getImages(imageIds) {
    const images = imageIds.map((id) => ({
      node: this.images.has(id) ? this.images.get(id) : null,
      node_id: id,
    }));
    return Promise.resolve(images);
  }

  getImageBuffer(url) {
    const {imageTileSize, imageTilesY} = this;
    const options = {tileSize: imageTileSize, tilesY: imageTilesY, url};
    return getImageBuffer(options);
  }

  getMesh(url) {
    const mesh = this.meshes.has(url)
      ? this.meshes.get(url)
      : {faces: [], vertices: []};
    return Promise.resolve(mesh);
  }

  getSequence(sequenceId) {
    return new Promise((resolve, reject) => {
      if (this.sequences.has(sequenceId)) {
        resolve(this.sequences.get(sequenceId));
      } else {
        reject(new Error(`Sequence ${sequenceId} does not exist`));
      }
    });
  }

  getSpatialImages(imageIds) {
    return this.getImages(imageIds);
  }
}

let viewer;

export function init(opts) {
  const {container} = opts;

  const imageId = 'image|fisheye|0';
  const dataProvider = new ProceduralDataProvider({});
  const options = {
    dataProvider,
    cameraControls: CameraControls.Earth,
    component: {
      cover: false,
      spatial: {cameraSize: 0.5, cellGridDepth: 3, cellsVisible: true},
    },
    container,
    imageTiling: false,
  };
  viewer = new Viewer(options);
  viewer.moveTo(imageId).catch((error) => console.error(error));
}

export function dispose() {
  if (viewer) {
    viewer.remove();
  }
}
