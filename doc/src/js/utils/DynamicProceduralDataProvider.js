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
  append(options) {
    this.idCounter = options.idCounter ?? this.idCounter;
    this.reference = options.reference ?? DEFAULT_REFERENCE;
    this.intervals = options.intervals ?? DEFAULT_INTERVALS;

    const appended = this._append();
    this._fire();

    return appended;
  }

  clear() {
    this._initialize();
  }

  populate(options) {
    this.reference = options.reference ?? DEFAULT_REFERENCE;
    this.intervals = options.intervals ?? DEFAULT_INTERVALS;

    this._populate();
    this._fire();
  }

  _fire() {
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
