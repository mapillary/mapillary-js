/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {Controller} from './Controller';

export class FunctionController extends Controller {
  constructor(object, property) {
    super(object, property);

    this.container.classList.add('function');

    this._onChange = this.object[this.property];

    this.container.addEventListener('click', (event) => {
      event.preventDefault();
      this.fire();
    });
  }

  fire() {
    if (this._onChange) {
      this._onChange();
    }
  }
}
