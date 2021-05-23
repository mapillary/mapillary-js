/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {Controller} from './Controller';

export class OptionController extends Controller {
  constructor(object, property, opts) {
    super(object, property);

    const options = opts.slice();
    this.select = document.createElement('select');
    for (const opt of options) {
      const option = document.createElement('option');
      option.innerHTML = opt;
      option.setAttribute('value', opt);
      this.select.appendChild(option);
    }

    this.container.appendChild(this.select);
    this.container.classList.add('option');

    this.select.addEventListener('change', (event) => {
      if (!this._onChange) {
        return;
      }
      const index = event.target.selectedIndex;
      const value = options[index];
      this.object[this.property] = value;
      this._onChange(value);
    });
  }
}
