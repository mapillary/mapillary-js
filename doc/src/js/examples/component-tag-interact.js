/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {
  OutlineTag,
  TagDomain,
  TagMode,
  Viewer,
} from '../../mapillary-js/dist/mapillary.module';

import {Folder} from '../options/Folder';
import {Log} from '../options/Log';
import {FunctionController} from '../options/FunctionController';

function makeFolder(container) {
  const folder = new Folder({open: true});
  container.appendChild(folder.container);
  return folder;
}

let viewer;
let log;

export function init(opts) {
  const {accessToken, container} = opts;
  const imageId = '1089584541525002';

  const componentOptions = {
    cover: false,
    tag: true,
  };
  const viewerOptions = {
    accessToken,
    component: componentOptions,
    container,
  };

  viewer = new Viewer(viewerOptions);

  const tagComponent = viewer.getComponent('tag');
  tagComponent.configure({createColor: 0xff00ff});

  viewer.moveTo(imageId).catch((error) => console.warn(error));

  const tags = new Map();

  const onTagState = (event) => {
    const tag = event.target;
    log.add(`'${event.type}' - ${tag.id}`);
  };

  const onImage = (event) => {
    const all = tagComponent.getAll();
    for (const tag of all) {
      tag.off('geometry', onTagState);
      tag.off('tag', onTagState);
    }
    tagComponent.removeAll();

    const {image} = event;
    if (tags.has(image.id)) {
      const imageTags = tags.get(image.id);
      for (const tag of imageTags) {
        tag.on('geometry', onTagState);
        tag.on('tag', onTagState);
      }
      tagComponent.add(imageTags);
    }
  };

  const onGeometryCreate = async (event) => {
    const {geometry} = event;

    log.add(`'${event.type}' - vertices: ${geometry.polygon.length - 1}`);

    const image = await viewer.getImage();
    if (!tags.has(image.id)) {
      tags.set(image.id, []);
    }

    const imageTags = tags.get(image.id);
    const tagId = `${image.id.substring(0, 3)}|${imageTags.length}`;
    const tagOptions = {
      editable: true,
      fillColor: 0xffff00,
      fillOpacity: 0.5,
      lineColor: 0xff00ff,
      domain: TagDomain.ThreeDimensional,
    };
    const tag = new OutlineTag(tagId, geometry, tagOptions);

    tag.on('geometry', onTagState);
    tag.on('tag', onTagState);

    imageTags.push(tag);
    tagComponent.add([tag]);
  };

  let hoveredTag = null;
  const onMouseMove = async (event) => {
    const {pixelPoint} = event;
    const tagIds = await tagComponent.getTagIdsAt(pixelPoint);
    const tagId = tagIds.length ? tagIds[0] : null;
    if (tagId !== hoveredTag) {
      log.add(`'${event.type}' - hovered: ${tagId}`);
      hoveredTag = tagId;
    }
  };

  const onTagComponentState = (event) => log.add(`'${event.type}'`);

  tagComponent.on('tagcreateend', onTagComponentState);
  tagComponent.on('tagcreatestart', onTagComponentState);
  tagComponent.on('geometrycreate', onGeometryCreate);
  tagComponent.on('tagmode', (event) =>
    log.add(`'${event.type}' - ${TagMode[event.mode]}`),
  );
  tagComponent.on('tags', (event) => {
    const all = tagComponent.getAll();
    log.add(`'${event.type}' - ${all.length}`);
  });

  viewer.on('image', onImage);
  viewer.on('mousemove', onMouseMove);

  const settings = makeFolder(container);

  {
    const folder = settings.addFolder({name: 'Tag Mode', open: true});
    const config = {
      createPolygon: () => tagComponent.changeMode(TagMode.CreatePolygon),
      cancel: () => tagComponent.changeMode(TagMode.Default),
    };
    folder.add(
      new FunctionController(config, 'createPolygon').setName('Create Polygon'),
    );

    folder.add(new FunctionController(config, 'cancel').setName('Cancel'));
  }

  log = new Log({
    classList: ['option-child'],
    container: settings.container,
    header: 'Log Tail (last 30 seconds)',
    timeout: 30,
  });
}

export function dispose() {
  if (viewer) {
    viewer.remove();
  }
  if (log) {
    log.clear();
  }
}
