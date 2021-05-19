/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {CancelMapillaryError} from '../../../mods/mapillary-js/dist/mapillary.module';

export function mapillaryErrorHandler(error) {
  if (error instanceof CancelMapillaryError) {
    console.warn(`Navigation request cancelled: ${error.message}`);
  } else {
    console.error(error);
  }
}
