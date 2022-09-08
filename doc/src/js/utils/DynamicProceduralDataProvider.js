/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {
  DEFAULT_INTERVALS,
  DEFAULT_REFERENCE,
  ProceduralDataProvider,
} from './ProceduralDataProvider';

export class DynamicProceduralDataProvider extends ProceduralDataProvider {
  clear() {
    this._initialize();
  }

  populate(options) {
    this.reference = options.reference ?? DEFAULT_REFERENCE;
    this.intervals = options.intervals ?? DEFAULT_INTERVALS;

    this._populate();

    const cellIds = [...this.cells.keys()];
    const target = this;
    const type = 'datacreate';
    const event = {
      cellIds,
      target,
      type,
    };
    this.fire(type, event);
  }
}
