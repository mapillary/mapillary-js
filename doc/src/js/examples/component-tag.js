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
  PolygonGeometry,
  RectGeometry,
  SpotTag,
  TagDomain,
  Viewer,
} from '../../../mods/mapillary-js/dist/mapillary.module';

import {Folder} from '../options/Folder';
import {BooleanController} from '../options/BooleanController';
import {FunctionController} from '../options/FunctionController';
import {NumberController} from '../options/NumberController';

const LIGHT_POINT = [0.6966, 0.3307];

const STOP_SIGN_RECT = [0.719, 0.454, 0.755, 0.505];
const STOP_STREET_RECT = [0.3561, 0.7212, 0.5698, 0.7549];

const DOME_POLYGON = [
  [0.4717, 0.2646],
  [0.4712, 0.2624],
  [0.4713, 0.2601],
  [0.4696, 0.2587],
  [0.4695, 0.2528],
  [0.4716, 0.2515],
  [0.472, 0.2463],
  [0.4733, 0.2435],
  [0.4744, 0.2459],
  [0.4764, 0.2356],
  [0.4815, 0.2194],
  [0.4878, 0.2043],
  [0.4951, 0.1905],
  [0.509, 0.1742],
  [0.5161, 0.1678],
  [0.5277, 0.1613],
  [0.5282, 0.151],
  [0.5293, 0.1488],
  [0.5295, 0.1446],
  [0.5284, 0.1428],
  [0.5302, 0.1401],
  [0.5312, 0.1383],
  [0.5311, 0.1262],
  [0.53, 0.122],
  [0.5272, 0.1146],
  [0.5283, 0.1133],
  [0.5285, 0.1104],
  [0.5271, 0.1096],
  [0.5306, 0.1039],
  [0.5321, 0.1037],
  [0.5325, 0.098],
  [0.5346, 0.0982],
  [0.5369, 0.0915],
  [0.5405, 0.0875],
  [0.5422, 0.084],
  [0.5405, 0.0808],
  [0.5414, 0.0784],
  [0.5436, 0.0764],
  [0.5423, 0.0738],
  [0.5437, 0.0704],
  [0.5438, 0.0534],
  [0.5459, 0.053],
  [0.5462, 0.0699],
  [0.5479, 0.0726],
  [0.5474, 0.0764],
  [0.5496, 0.0789],
  [0.5485, 0.0836],
  [0.549, 0.0864],
  [0.5534, 0.0912],
  [0.5563, 0.0974],
  [0.5571, 0.101],
  [0.558, 0.098],
  [0.5594, 0.0987],
  [0.5592, 0.1009],
  [0.5602, 0.1048],
  [0.5617, 0.1044],
  [0.5641, 0.1098],
  [0.5625, 0.1129],
  [0.5632, 0.1155],
  [0.5606, 0.1216],
  [0.5607, 0.1369],
  [0.5615, 0.1392],
  [0.564, 0.1437],
  [0.5633, 0.1461],
  [0.5633, 0.149],
  [0.5649, 0.1502],
  [0.5638, 0.1584],
  [0.5796, 0.1673],
  [0.5947, 0.1833],
  [0.6075, 0.202],
  [0.6141, 0.2183],
  [0.62, 0.2403],
  [0.6216, 0.2561],
  [0.6234, 0.2521],
  [0.623, 0.2498],
  [0.6243, 0.2463],
  [0.6269, 0.2498],
  [0.6266, 0.252],
  [0.629, 0.2547],
  [0.6293, 0.2608],
  [0.6271, 0.2625],
  [0.6272, 0.2649],
  [0.6256, 0.2663],
  [0.6181, 0.2593],
  [0.6031, 0.2511],
  [0.5971, 0.2482],
  [0.5974, 0.2454],
  [0.5853, 0.2424],
  [0.5822, 0.2457],
  [0.5593, 0.2429],
  [0.5344, 0.2437],
  [0.5272, 0.2444],
  [0.5252, 0.2419],
  [0.5117, 0.2455],
  [0.5117, 0.2487],
  [0.4928, 0.2557],
  [0.4761, 0.265],
  [0.4722, 0.2666],
  [0.4717, 0.2646],
];

function randomColor() {
  return `#${Math.floor(Math.random() * 16777215)
    .toString(16)
    .padStart(6, '0')}`;
}

function makeFolder(container) {
  const folder = new Folder({open: true});
  container.appendChild(folder.container);
  return folder;
}

let viewer;

export function init(opts) {
  const {accessToken, container} = opts;
  const imageId = 'GlwvajfC7oML4PkLzHrB7g';

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

  viewer.moveTo(imageId).catch((error) => console.warn(error));

  const textColor = 0xffffff;

  const domeGeometry = new PolygonGeometry(DOME_POLYGON);
  const domeColor = 0xff00ff;
  const domeOptions = {
    domain: TagDomain.ThreeDimensional,
    fillColor: domeColor,
    fillOpacity: 0.6,
    lineColor: domeColor,
    text: 'Dome',
    textColor,
  };
  const dome = new OutlineTag('dome-tag', domeGeometry, domeOptions);

  const signGeometry = new RectGeometry(STOP_SIGN_RECT);
  const signColor = 0xff0000;
  const signOptions = {
    fillColor: signColor,
    fillOpacity: 0.3,
    lineColor: signColor,
    text: 'Stop',
    textColor,
  };
  const sign = new OutlineTag('stop-sign-tag', signGeometry, signOptions);

  const streetGeometry = new RectGeometry(STOP_STREET_RECT);
  const street = new OutlineTag('stop-street-tag', streetGeometry);

  const lightGeometry = new PointGeometry(LIGHT_POINT);
  const lightColor = 0x0000ff;
  const lightOptions = {
    color: lightColor,
    text: 'Light',
    textColor,
  };
  const light = new SpotTag('light-tag', lightGeometry, lightOptions);

  const tags = [sign, street, light, dome];

  const onImage = (event) => {
    if (event.image.id === imageId) {
      tagComponent.add(tags);
    } else {
      tagComponent.removeAll();
    }
  };
  viewer.on('image', onImage);

  const settings = makeFolder(container);

  {
    const folder = settings.addFolder({name: 'Edit', open: true});
    const config = {
      editable: false,
    };
    folder.add(
      new BooleanController(config, 'editable')
        .setName('Editable')
        .onChange((value) => {
          for (const tag of tags) {
            tag.editable = value;
          }
        }),
    );
  }

  {
    const folder = settings.addFolder({name: 'Appearance', open: true});
    const config = {
      fillOpacity: 0.4,
      lineOpacity: 1,
      randomColor: () => {
        for (const tag of tags) {
          const color = randomColor();
          if (tag instanceof OutlineTag) {
            tag.setOptions({
              fillColor: color,
              lineColor: color,
            });
          } else if (tag instanceof SpotTag) {
            tag.setOptions({
              color,
            });
          }
        }
      },
      textColor: () => {
        const color = randomColor();
        for (const tag of tags) {
          tag.textColor = color;
        }
      },
    };
    folder.add(
      new NumberController(config, 'fillOpacity', {min: 0, max: 1})
        .setName('Fill opacity')
        .onChange((value) => {
          for (const tag of tags) {
            if (tag instanceof OutlineTag) {
              tag.fillOpacity = value;
            }
          }
        }),
    );
    folder.add(
      new NumberController(config, 'lineOpacity', {min: 0, max: 1})
        .setName('Line opacity')
        .onChange((value) => {
          for (const tag of tags) {
            if (tag instanceof OutlineTag) {
              tag.lineOpacity = value;
            }
          }
        }),
    );
    folder.add(
      new FunctionController(config, 'randomColor').setName('Random Color'),
    );
    folder.add(
      new FunctionController(config, 'textColor').setName('Text Color'),
    );
  }
}

export function dispose() {
  if (viewer) {
    viewer.remove();
  }
}
