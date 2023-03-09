/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {enuToGeodetic} from '../../mapillary-js/dist/mapillary.module';

import {generateImageBuffer as genImageBuffer} from './image';

const ASPECT_FISHEYE = 3 / 2;
const ASPECT_PERSPECTIVE = 4 / 3;
const ASPECT_SPHERICAL = 2;

export const CAMERA_TYPE_FISHEYE = 'fisheye';
export const CAMERA_TYPE_PERSPECTIVE = 'perspective';
export const CAMERA_TYPE_SPHERICAL = 'spherical';

export function cameraTypeToAspect(cameraType) {
  switch (cameraType) {
    case CAMERA_TYPE_FISHEYE:
      return ASPECT_FISHEYE;
    case CAMERA_TYPE_PERSPECTIVE:
      return ASPECT_PERSPECTIVE;
    case CAMERA_TYPE_SPHERICAL:
      return ASPECT_SPHERICAL;
    default:
      throw new Error(`Camera type ${cameraType} not supported`);
  }
}

export function generateImageBuffer(options) {
  const {tileSize, tilesY, url} = options;
  const aspect = cameraTypeToAspect(url);
  return genImageBuffer({
    tileSize,
    tilesX: aspect * tilesY,
    tilesY,
  });
}

export function generateCells(images, geometryProvider) {
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

export function generateCluster(options, intervals) {
  const {cameraType, color, east, focal, height, id, k1, k2, width} = options;
  let {idCounter} = options;
  const {alt, lat, lng} = options.reference;

  const distance = 5;

  const images = [];
  const thumbUrl = `${cameraType}`;
  const clusterId = id ?? `cluster|${cameraType}`;
  const sequenceId = id ?? `sequence|${cameraType}`;
  const sequence = {id: sequenceId, image_ids: []};

  const start = idCounter;
  const end = idCounter + intervals;

  while (idCounter <= end) {
    const imageId = id
      ? `image|${id}|${cameraType}|${idCounter}`
      : `image|${cameraType}|${idCounter}`;
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
    const cameraParameters =
      cameraType === CAMERA_TYPE_SPHERICAL ? [] : [focal, k1, k2];

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
