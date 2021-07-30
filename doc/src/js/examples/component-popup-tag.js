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
  PointGeometry,
  Popup,
  RectGeometry,
  SpotTag,
  Viewer,
} from '../../mapillary-js/dist/mapillary.module';

function createPopup(label) {
  const span = document.createElement('span');
  span.style.color = '#000';
  span.textContent = label;
  const popup = new Popup({offset: 6});
  popup.setDOMContent(span);
  return popup;
}

let viewer;

export function init(opts) {
  const {accessToken, container} = opts;
  const imageId = '994660037983256';

  const componentOptions = {
    cover: false,
    popup: true,
    tag: true,
  };
  const viewerOptions = {
    accessToken,
    component: componentOptions,
    container,
  };

  viewer = new Viewer(viewerOptions);
  const popupComponent = viewer.getComponent('popup');
  const tagComponent = viewer.getComponent('tag');

  viewer.moveTo(imageId).catch((error) => console.warn(error));

  const tagPopups = new Map();

  const onGeometry = (event) => {
    const tag = event.target;
    const popup = tagPopups.get(tag.id);

    if (tag.geometry instanceof PointGeometry) {
      popup.setBasicPoint(tag.geometry.point);
    } else if (tag.geometry instanceof RectGeometry) {
      popup.setBasicRect(tag.geometry.rect);
    } else {
      console.warn('Unhandled tag geometry type');
    }
  };

  // Connect a rectangle tag to a popup
  const rect = [0.687, 0.444, 0.86, 0.585];
  const rectGeometry = new RectGeometry(rect);
  const rectTag = new OutlineTag('rect-tag', rectGeometry, {
    editable: true,
  });
  rectTag.on('geometry', onGeometry);

  const rectPopup = createPopup('Concrete Bench');
  rectPopup.setBasicRect(rect);
  tagPopups.set(rectTag.id, rectPopup);

  // Connect a point tag to a popup
  const point = [0.272, 0.205];
  const pointGeometry = new PointGeometry(point);
  const pointTag = new SpotTag('point-tag', pointGeometry, {
    editable: true,
  });
  pointTag.on('geometry', onGeometry);

  const pointPopup = createPopup('Street Light');
  pointPopup.setBasicPoint(point);
  tagPopups.set(pointTag.id, pointPopup);

  const onImage = (event) => {
    if (event.image.id === imageId) {
      tagComponent.add([rectTag, pointTag]);
      popupComponent.add([rectPopup, pointPopup]);
    } else {
      tagComponent.removeAll();
      popupComponent.removeAll();
    }
  };
  viewer.on('image', onImage);
}

export function dispose() {
  if (viewer) {
    viewer.remove();
  }
}
