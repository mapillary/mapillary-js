/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {Controller} from './Controller';

export class BooleanController extends Controller {
  constructor(object, property) {
    super(object, property);

    this.checkbox = document.createElement('input');
    this.checkbox.setAttribute('type', 'checkbox');
    this.checkbox.style.pointerEvents = 'none';
    this.content = document.createElement('div');
    this.content.appendChild(this.checkbox);

    this.container.appendChild(this.content);
    this.container.classList.add('boolean');

    this.applyValue(this.getValue());

    this.checkbox.addEventListener('change', (event) => {
      if (!this._onChange) {
        return;
      }
      this._onChange(event.target.checked);
    });
    this.container.addEventListener('click', () => {
      this.checkbox.dispatchEvent(new MouseEvent('click', {bubbles: false}));
    });
  }

  listen() {
    const self = this;
    let value = this.getValue();
    Object.defineProperty(this.object, this.property, {
      get() {
        return value;
      },
      set(newValue) {
        value = newValue;
        self.applyValue(value);
      },
      writeable: true,
    });
    this.listening = true;
    return this;
  }

  applyValue(value) {
    if (this.checkbox.checked === value) {
      return;
    }
    this.checkbox.checked = value;
  }
}
