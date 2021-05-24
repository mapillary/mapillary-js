/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

export class Folder {
  constructor(opts) {
    const options = opts ?? {};
    this.container = document.createElement('div');

    this.parent = options.parent;
    if (!this.parent) {
      this.container.classList.add('example-option-container');
    }
    this.folder = document.createElement('div');
    this.folder.classList.add(this.parent ? 'folder' : 'root');
    if (options.open) {
      this.folder.classList.add('active');
    }
    this.name = document.createElement('span');
    this.name.textContent = options.parent ? options.name : 'Open Controls';
    this.folder.appendChild(this.name);

    this.content = document.createElement('div');
    this.content.style.display = options.open ? 'block' : 'none';
    this.content.classList.add('content');
    this.container.appendChild(this.folder);
    this.container.appendChild(this.content);

    this.folder.addEventListener('click', () => {
      const display = this.content.style.display === 'block' ? 'none' : 'block';
      if (!this.parent) {
        this.name.textContent =
          display === 'block' ? 'Close Controls' : 'Open Controls';
      }
      this.folder.classList.toggle('active');
      this.content.style.display = display;
    });
  }

  add(child) {
    this.content.appendChild(child.container);
  }

  addFolder(opts) {
    const options = Object.assign(opts, {parent: this});
    const folder = new Folder(options);
    this.content.appendChild(folder.container);
    return folder;
  }
}
