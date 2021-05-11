/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {Viewer} from 'mapillary-js';

let viewer;

export function init(opts) {
  const {container} = opts;
  const options = {
    apiClient: 'QjI1NnU0aG5FZFZISE56U3R5aWN4ZzpkYzg0NzE3MDA0YTRhZjlh',
    component: {cover: false},
    container,
  };
  viewer = new Viewer(options);
  viewer
    .moveTo('ie9ktAVyhibDCD_V0m6apQ')
    .catch((error) => console.error(error));
}

export function dispose() {
  viewer.remove();
}
