/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

export class Log {
  constructor(options) {
    this.size = options.size ?? 10;
    this.timeout = options.timeout ?? 0;
    this.fifo = [];

    this.container = document.createElement('div');
    this.container.classList.add('example-log-container');
    if (options.classList) {
      for (const className of options.classList) {
        this.container.classList.add(className);
      }
    }
    this.header = document.createElement('div');
    this.header.classList.add('header');
    this.header.textContent = options.header;
    this.container.appendChild(this.header);
    options.container.appendChild(this.container);
  }

  add(message) {
    const {container, fifo, size, timeout} = this;

    while (fifo.length >= size) {
      const shifted = fifo.shift();
      container.removeChild(shifted.container);
      window.clearTimeout(shifted.timeoutId);
    }

    const log = document.createElement('div');
    log.classList.add('log-item');
    log.textContent = message;
    container.appendChild(log);

    function onTimeout(item) {
      return () => {
        const index = fifo.indexOf(item);
        if (index === -1) {
          return;
        }
        const items = fifo.splice(index, 1);
        items.forEach((i) => {
          container.removeChild(i.container);
        });
      };
    }

    const logItem = {container: log, timeoutId: null};
    if (this.timeout > 0) {
      logItem.timeoutId = window.setTimeout(onTimeout(logItem), timeout * 1e3);
    }
    fifo.push(logItem);
  }

  clear() {
    if (this.timeout > 0) {
      this.fifo.forEach((item) => window.clearTimeout(item.timeoutId));
    }
    this.fifo = [];
  }
}
