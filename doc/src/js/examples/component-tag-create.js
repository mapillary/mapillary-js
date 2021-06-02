/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {
  ExtremePointTag,
  OutlineTag,
  PointGeometry,
  PointsGeometry,
  PolygonGeometry,
  RectGeometry,
  SpotTag,
  TagDomain,
  TagMode,
  Viewer,
} from '../../../mods/mapillary-js/dist/mapillary.module';

import {Folder} from '../options/Folder';
import {FunctionController} from '../options/FunctionController';

function makeFolder(container) {
  const folder = new Folder({open: true});
  container.appendChild(folder.container);
  return folder;
}

let viewer;

export function init(opts) {
  const {accessToken, container} = opts;
  const imageId = 'WDW3nFcHoNpYhdCBEK-8TQ';

  const componentOptions = {
    cover: false,
    tag: true,
  };
  const viewerOptions = {
    apiClient: accessToken,
    component: componentOptions,
    container,
  };

  viewer = new Viewer(viewerOptions);
  const tagComponent = viewer.getComponent('tag');
  tagComponent.configure({createColor: 0xff00ff});

  viewer.moveTo(imageId).catch((error) => console.warn(error));

  const tags = new Map();

  const onImage = (event) => {
    tagComponent.removeAll();

    const {image} = event;
    if (tags.has(image.id)) {
      tagComponent.add(tags.get(image.id));
    }
  };
  viewer.on('image', onImage);

  tagComponent.on('geometrycreate', async (event) => {
    const {geometry} = event;

    const image = await viewer.getImage();
    if (!tags.has(image.id)) {
      tags.set(image.id, []);
    }

    const imageTags = tags.get(image.id);
    const tagId = `${image.id}|${imageTags.length}`;
    const color = 0x00ffff;
    let tagOptions = {
      editable: true,
      fillColor: color,
      fillOpacity: 0.5,
      lineColor: 0xffff00,
    };

    let tag;
    if (geometry instanceof RectGeometry) {
      tagOptions = {...tagOptions, text: 'Outline'};
      tag = new OutlineTag(tagId, geometry, tagOptions);
    } else if (geometry instanceof PointGeometry) {
      tagOptions = {editable: true, color, text: 'Spot'};
      tag = new SpotTag(tagId, geometry, tagOptions);
    } else if (geometry instanceof PolygonGeometry) {
      tagOptions = {
        ...tagOptions,
        domain: TagDomain.ThreeDimensional,
        text: 'Outline',
      };
      tag = new OutlineTag(tagId, geometry, tagOptions);
    } else if (geometry instanceof PointsGeometry) {
      tag = new ExtremePointTag(tagId, geometry, tagOptions);
    } else {
      throw new Error('Unsupported geometry type');
    }
    imageTags.push(tag);
    tagComponent.add([tag]);
  });

  const settings = makeFolder(container);

  {
    const folder = settings.addFolder({name: 'Tag Mode', open: true});
    const config = {
      createPoint: () => tagComponent.changeMode(TagMode.CreatePoint),
      createPoints: () => tagComponent.changeMode(TagMode.CreatePoints),
      createPolygon: () => tagComponent.changeMode(TagMode.CreatePolygon),
      createRect: () => tagComponent.changeMode(TagMode.CreateRect),
      createRectDrag: () => tagComponent.changeMode(TagMode.CreateRectDrag),
      cancel: () => tagComponent.changeMode(TagMode.Default),
    };
    folder.add(
      new FunctionController(config, 'createPoint').setName('Click Point'),
    );
    folder.add(
      new FunctionController(config, 'createPolygon').setName('Click Polygon'),
    );
    folder.add(
      new FunctionController(config, 'createRect').setName('Click Rectangle'),
    );
    folder.add(
      new FunctionController(config, 'createRectDrag').setName(
        'Drag Rectangle',
      ),
    );
    folder.add(
      new FunctionController(config, 'createPoints').setName(
        'Extreme Point Rectangle',
      ),
    );
    folder.add(new FunctionController(config, 'cancel').setName('Cancel'));
  }
}

export function dispose() {
  if (viewer) {
    viewer.remove();
  }
}
