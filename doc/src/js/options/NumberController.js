/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {Controller} from './Controller';

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function inverseLerp(v0, v1, value) {
  return (value - v0) / (v1 - v0);
}

function lerp(v0, v1, t) {
  return v0 + t * (v1 - v0);
}

export class NumberController extends Controller {
  constructor(object, property, params) {
    super(object, property);

    this.min = params.min;
    this.max = params.max;

    this.foreground = document.createElement('div');
    this.foreground.classList.add('slider-foreground');
    this.background = document.createElement('div');
    this.background.classList.add('slider-background');
    this.background.appendChild(this.foreground);
    this.content = document.createElement('div');
    this.content.classList.add('slider-content');
    this.content.appendChild(this.background);
    this.container.appendChild(this.content);
    this.container.classList.add('number');

    this.applyValue(this.getValue());

    const onMouseDrag = (event) => {
      event.preventDefault();

      const rect = this.background.getBoundingClientRect();
      const t = inverseLerp(rect.left, rect.right, event.clientX);
      const value = lerp(this.min, this.max, t);

      this.object[this.property] = value;
      this.applyValue(value);

      if (this._onChange) {
        this._onChange(value);
      }

      return false;
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseDrag);
      document.removeEventListener('mouseup', onMouseUp);
    };

    const onMouseDown = (event) => {
      document.activeElement.blur();
      document.addEventListener('mousemove', onMouseDrag);
      document.addEventListener('mouseup', onMouseUp);
      onMouseDrag(event);
    };

    this.background.addEventListener('mousedown', onMouseDown);

    this.applyValue(this.getValue());
  }

  applyValue(value) {
    const {max, min} = this;
    const pct = clamp(inverseLerp(min, max, value), min, max);
    this.foreground.style.width = `${100 * pct}%`;
  }
}
