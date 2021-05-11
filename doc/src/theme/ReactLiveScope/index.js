/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import React from 'react';
import {Viewer} from 'mapillary-js';
import '../../../node_modules/mapillary-js/dist/mapillary.css';

// Add react-live imports you need here
const ReactLiveScope = {
  React,
  ...React,
  Viewer,
};

export default ReactLiveScope;
