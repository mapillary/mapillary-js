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

import {generateCells, generateImageBuffer} from './provider';

const IMAGE_TILE_SIZE = 10;
const IMAGE_TILES_Y = 10;

export const REFERENCE = {alt: 0, lat: 0, lng: 0};

export class ChunkDataProvider extends DataProviderBase {
  constructor() {
    super(new S2GeometryProvider());

    this.chunks = new Map();
    this.cells = new Map();
    this.clusters = new Map();
    this.images = new Map();
    this.sequences = new Map();
  }

  addChunk(chunk) {
    if (this.chunks.has(chunk.id)) {
      throw new Error(`Chunk already exists ${chunk.id}`);
    }

    const {cluster, images, sequence} = chunk;

    if (this.clusters.has(cluster.id)) {
      throw new Error(`Cluster already exists ${cluster.id}`);
    }
    if (this.sequences.has(sequence.id)) {
      throw new Error(`Sequence already exists ${sequence.id}`);
    }
    for (const imageId of images.keys()) {
      if (this.images.has(imageId)) {
        throw new Error(`Image already exists ${imageId}`);
      }
    }

    this.chunks.set(chunk.id, chunk);
    this.clusters.set(cluster.id, cluster);
    this.sequences.set(sequence.id, sequence);

    for (const image of images.values()) {
      this.images.set(image.id, image);
    }
    const cells = generateCells(this.images.values(), this._geometry);
    for (const [cellId, cellImages] of cells.entries()) {
      if (!this.cells.has(cellId)) {
        this.cells.set(cellId, new Map());
      }
      const cell = this.cells.get(cellId);
      for (const cellImage of cellImages) {
        cell.set(cellImage.id, cellImage);
      }
    }

    const dataCreateEvent = {
      cellIds: Array.from(cells.keys()),
      target: this,
      type: 'datacreate',
    };
    this.fire(dataCreateEvent.type, dataCreateEvent);
  }

  deleteChunks(chunkIds) {
    for (const chunkId of chunkIds) {
      if (!this.chunks.has(chunkId)) {
        throw new Error(`Chunk does not exist ${chunkId}`);
      }

      const {cluster, images, sequence} = this.chunks.get(chunkId);

      this.chunks.delete(chunkId);
      this.clusters.delete(cluster.id);
      this.sequences.delete(sequence.id);

      for (const image of images.values()) {
        this.images.delete(image.id);
        const cellId = this._geometry.lngLatToCellId(image.geometry);
        this.cells.get(cellId).delete(image.id);
      }
    }

    const dataDeleteEvent = {
      clusterIds: chunkIds,
      target: this,
      type: 'datadelete',
    };
    this.fire(dataDeleteEvent.type, dataDeleteEvent);
  }

  getCluster(url) {
    if (this.clusters.has(url)) {
      return Promise.resolve(this.clusters.get(url));
    }

    return Promise.reject(new Error(`Cluster does not exist ${url}`));
  }

  getCoreImages(cellId) {
    const images = this.cells.has(cellId) ? this.cells.get(cellId) : new Map();
    return Promise.resolve({
      cell_id: cellId,
      images: Array.from(images.values()),
    });
  }

  getImages(imageIds) {
    const images = [];
    for (const imageId of imageIds) {
      if (!this.images.has(imageId)) {
        return Promise.reject(new Error(`Image does not exist ${imageId}`));
      }
      images.push({
        node: this.images.get(imageId),
        node_id: imageId,
      });
    }
    return Promise.resolve(images);
  }

  // eslint-disable-next-line class-methods-use-this
  getImageBuffer(url) {
    return generateImageBuffer({
      tileSize: IMAGE_TILE_SIZE,
      tilesY: IMAGE_TILES_Y,
      url,
    });
  }

  // eslint-disable-next-line class-methods-use-this
  getMesh(_url) {
    return Promise.resolve({faces: [], vertices: []});
  }

  getSequence(sequenceId) {
    if (this.sequences.has(sequenceId)) {
      return Promise.resolve(this.sequences.get(sequenceId));
    }

    return Promise.reject(new Error(`Sequence does not exist ${sequenceId}`));
  }

  getSpatialImages(imageIds) {
    return this.getImages(imageIds);
  }
}
