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
  DataProviderBase,
  S2GeometryProvider,
} from '../../mapillary-js/dist/mapillary.module';

import {generateImageBuffer} from './image';

const ASPECT_FISHEYE = 3 / 2;
const ASPECT_PERSPECTIVE = 4 / 3;
const ASPECT_SPHERICAL = 2;

const FISHEYE = 'fisheye';
const PERSPECTIVE = 'perspective';
const SPHERICAL = 'spherical';

export const DEFAULT_REFERENCE = {alt: 0, lat: 0, lng: 0};
export const DEFAULT_INTERVALS = 10;

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
  const {cameraType, color, east, focal, height, k1, k2, width} = options;
  let {idCounter} = options;
  const {alt, lat, lng} = options.reference;

  const distance = 5;

  const images = [];
  const thumbUrl = `${cameraType}`;
  const clusterId = `cluster|${cameraType}`;
  const sequenceId = `sequence|${cameraType}`;
  const sequence = {id: sequenceId, image_ids: []};

  const start = idCounter;
  const end = idCounter + intervals;

  while (idCounter <= end) {
    const imageId = `image|${cameraType}|${idCounter}`;
    const thumbId = `thumb|${cameraType}|${idCounter}`;
    const meshId = `mesh|${cameraType}|${idCounter}`;
    sequence.image_ids.push(imageId);

    const index = idCounter - start;
    const north = (-intervals * distance) / 2 + distance * index;
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

    idCounter += 1;
  }

  const cluster = {
    colors: [],
    coordinates: [],
    id: clusterId,
    pointIds: [],
    reference: options.reference,
  };
  for (let i = 0; i <= intervals; i++) {
    const easts = [-3, 3];
    const north = (-intervals * distance) / 2 + distance * i;
    const up = 0;
    for (let y = 0; y < distance; y++) {
      for (let z = 0; z < distance; z++) {
        for (const x of easts) {
          const pointId = `${i}-${z}-${y}-${x}`;
          const cx = east + x;
          const cy = north + y;
          const cz = up + z;
          cluster.pointIds.push(pointId);
          cluster.coordinates.push(cx, cy, cz);
          cluster.colors.push(...color);
        }
      }
    }
  }

  return {cluster, images, sequence};
}

function generateClusters(options) {
  const {height, intervals, reference} = options;
  let {idCounter} = options;

  const clusters = [];
  const images = [];
  const sequences = [];

  const clusterConfigs = [
    {
      cameraType: PERSPECTIVE,
      color: [1, 0, 0],
      east: -9,
      focal: 0.8,
      k1: -0.13,
      k2: 0.07,
      reference,
    },
    {
      cameraType: FISHEYE,
      color: [0, 1, 0],
      east: 9,
      focal: 0.45,
      k1: -0.006,
      k2: 0.004,
      reference,
    },
    {
      cameraType: SPHERICAL,
      color: [1, 1, 0],
      east: 0,
      reference,
    },
  ];

  for (const config of clusterConfigs) {
    const aspect = cameraTypeToAspect(config.cameraType);
    config.width = aspect * height;
    config.height = height;
    config.idCounter = idCounter;
    const cluster = generateCluster(config, intervals);
    idCounter += intervals + 1;
    clusters.push(cluster.cluster);
    images.push(...cluster.images);
    sequences.push(cluster.sequence);
  }

  return {
    clusters: new Map(clusters.map((c) => [c.id, c])),
    images: new Map(images.map((i) => [i.id, i])),
    sequences: new Map(sequences.map((s) => [s.id, s])),
  };
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

    this.idCounter = options.idCounter ?? 0;
    this.intervals = options.intervals ?? DEFAULT_INTERVALS;
    this.reference = options.reference ?? DEFAULT_REFERENCE;
    this.imageTileSize = 10;
    this.imageTilesY = 10;

    this._initialize();
    this._populate();
  }

  getCluster(url) {
    const cluster = this.clusters.has(url)
      ? this.clusters.get(url)
      : {points: {}, reference: this.reference};
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

  _initialize() {
    this.sequences = new Map();
    this.images = new Map();
    this.clusters = new Map();
    this.cells = new Map();
    this.meshes = new Map();
  }

  _populate() {
    const clusters = generateClusters({
      height: this.imageTileSize * this.imageTilesY,
      idCounter: this.idCounter,
      intervals: this.intervals,
      reference: this.reference,
    });
    this.idCounter += clusters.images.size;
    this.sequences = clusters.sequences;
    this.images = clusters.images;
    this.clusters = clusters.clusters;
    this.cells = generateCells(this.images.values(), this._geometry);
  }
}
