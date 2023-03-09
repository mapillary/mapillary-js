/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {ProceduralDataProvider} from './ProceduralDataProvider';

export class DeletableProceduralDataProvider extends ProceduralDataProvider {
  delete() {
    if (!this.clusters.size) {
      return;
    }

    const clusterId = this.clusters.keys().next().value;
    this.clusters.delete(clusterId);

    for (const [imageId, image] of this.images.entries()) {
      if (image.cluster.id !== clusterId) {
        continue;
      }

      this.images.delete(imageId);
      this.sequences.delete(image.sequence.id);
      for (const cellImages of this.cells.values()) {
        const index = cellImages.indexOf(image);
        if (index !== -1) {
          cellImages.splice(index, 1);
        }
      }
    }

    this._fire([clusterId]);
  }

  _fire(clusterIds) {
    const target = this;
    const type = 'datadelete';
    const event = {
      clusterIds,
      target,
      type,
    };
    this.fire(type, event);
  }
}
