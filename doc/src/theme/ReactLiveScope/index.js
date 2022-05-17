/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import React from 'react';
import * as three from 'three';
import * as mapillary from '../../mapillary-js/dist/mapillary.module';

import {accessToken} from '../../../.access-token/token';
import {mapillaryErrorHandler} from '../../js/utils/error';
import {ViewerComponent} from '../../js/components/ViewerComponent';

import * as animation from '../../js/examples/extend-animation';
import * as flycontrols from '../../js/examples/extend-fly-controls';
import * as graphics from '../../js/examples/extend-graphics-developer';
import * as threerenderer from '../../js/examples/extend-three-renderer';
import * as webglrenderer from '../../js/examples/extend-webgl-renderer';

import * as procedural from '../../js/utils/ProceduralDataProvider';
import * as image from '../../js/utils/image';

import '../../mapillary-js/dist/mapillary.css';

// Add react-live imports you need here
const ReactLiveScope = {
  accessToken,
  mapillaryErrorHandler,
  animation,
  flycontrols,
  graphics,
  webglrenderer,
  threerenderer,
  procedural,
  image,
  ...mapillary,
  three,
  ViewerComponent,
  React,
  ...React,
};

export default ReactLiveScope;
