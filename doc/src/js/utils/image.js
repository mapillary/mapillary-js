/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

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
