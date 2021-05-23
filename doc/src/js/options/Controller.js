/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

export class Controller {
  constructor(object, property) {
    this.object = object;
    this.property = property;

    this.name = document.createElement('span');
    this.name.textContent = property;

    this.container = document.createElement('div');
    this.container.classList.add('controller');
    this.container.appendChild(this.name);

    this._onChange = null;
  }

  getValue() {
    return this.object[this.property];
  }

  onChange(handler) {
    this._onChange = handler;
    return this;
  }

  setName(name) {
    this.name.textContent = name;
    return this;
  }
}
