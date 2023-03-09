/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {
  DataProviderBase,
  S2GeometryProvider,
} from '../../mapillary-js/dist/mapillary.module';

import {
  CAMERA_TYPE_FISHEYE,
  CAMERA_TYPE_PERSPECTIVE,
  CAMERA_TYPE_SPHERICAL,
  cameraTypeToAspect,
  generateCells,
  generateCluster,
  generateImageBuffer,
} from './provider';

export const DEFAULT_REFERENCE = {alt: 0, lat: 0, lng: 0};
export const DEFAULT_INTERVALS = 10;

function generateClusters(options) {
  const {height, intervals, reference} = options;
  let {idCounter} = options;

  const clusters = [];
  const images = [];
  const sequences = [];

  const clusterConfigs = [
    {
      cameraType: CAMERA_TYPE_PERSPECTIVE,
      color: [1, 0, 0],
      east: -9,
      focal: 0.8,
      k1: -0.13,
      k2: 0.07,
      reference,
    },
    {
      cameraType: CAMERA_TYPE_FISHEYE,
      color: [0, 1, 0],
      east: 9,
      focal: 0.45,
      k1: -0.006,
      k2: 0.004,
      reference,
    },
    {
      cameraType: CAMERA_TYPE_SPHERICAL,
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
    return generateImageBuffer(options);
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

  _append() {
    const clusters = generateClusters({
      height: this.imageTileSize * this.imageTilesY,
      idCounter: this.idCounter,
      intervals: this.intervals,
      reference: this.reference,
    });
    this.idCounter += clusters.images.size;
    this.sequences = new Map([...this.sequences, ...clusters.sequences]);
    this.images = new Map([...this.images, ...clusters.images]);
    this.clusters = new Map([...this.clusters, ...clusters.clusters]);
    const cells = generateCells(this.images.values(), this._geometry);
    for (const cellId of cells.keys()) {
      if (!this.cells.has(cellId)) {
        this.cells.set(cellId, []);
      }
      this.cells.get(cellId).push(...cells.get(cellId));
    }

    return [...clusters.images.keys()];
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
