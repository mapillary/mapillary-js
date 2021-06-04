---
id: procedural-data-provider
title: Procedural Data Provider
---

You can use the data provider API to provide data in the MapillaryJS [ent format](/api/modules/api#interfaces). The data can come from anywhere, e.g. [service APIs](https://www.mapillary.com/developer/api-documentation/), [JSON files](https://github.com/mapillary/OpenSfM/blob/6585f0561e7c9d4907eadc7bc2fb9dbdad8a2945/viewer/src/provider/OpensfmDataProvider.js#L66-L99), or even be generated on the fly in the browser. In this guide we will do procedural data generation for simplicity.

:::info You will learn

- How to convert your data to compatible MapillaryJS contracts and ents
- How to create your own provider by extending the `DataProviderBase` class
- How to make the `Viewer` use your data provider to load data

:::

## Overview

We will soon go into the details of our data provider, but first we will get an overview of the data provider concept. The data provider overview below explains how the data provider API works, step by step.

![Data Provider Overview](/img/extension/data-provider-design.png)

_Data provider overview_

The data provider API works like this:

1. We start at the bottom with our own data format. We want to use it in MapillaryJS.
2. We determine a way of serving our data to the provider. This could be through a web service, through file IO dialogs, or any other way that suites our use case. In our procedural data provider, we will generate the data on the fly in the browser.
3. To consume the data we write our own data provider class which is responsible for data loading and conversion to the MapillaryJS ent format.
4. When creating the MapillaryJS viewer, we supply our provider instance as an option.
5. The default data provider is overridden and our own provider is used instead.
6. When MapillaryJS makes requests, our provider will make all the decisions about how to retrieve the data and how to convert it.

Now, let's dig a bit deeper.

## Image Generation

MapillaryJS depends on images being provided for each camera capture in the data. Therefore we begin by generating images to have a foundation. We will provide images of mango colored grids because of their nice visualization properies.

```jsx live
function Image(props) {
  const [src, setSrc] = useState('');
  const urlRef = useRef('');

  const aspect = 2;
  const tileSize = 10;
  const tilesY = 10;
  const tilesX = aspect * tilesY;

  const scale = 2;
  const width = scale * tileSize * tilesX;
  const height = scale * tileSize * tilesY;

  useEffect(() => {
    let didCancel = false;

    async function createURL() {
      const buffer = await procedural.generateImageBuffer({
        tileSize,
        tilesX: aspect * tilesY,
        tilesY,
      });

      if (didCancel) {
        return;
      }

      const blob = new Blob([buffer]);
      const objectURL = window.URL.createObjectURL(blob);
      setSrc(objectURL);
      urlRef.current = objectURL;
    }

    createURL();

    return function cleanup() {
      didCancel = true;
      const objectURL = urlRef.current;
      if (objectURL) {
        window.URL.revokeObjectURL(objectURL);
      }
    };
  }, []);

  return <img src={src} style={{height: `${height}px`, width: `${width}px`}} />;
}
```

:::note

If your data does not contain any images, you can generate image buffers consisting of a single pixel and provide them to MapillaryJS. See the [OpenSfM visualization tool](https://github.com/mapillary/OpenSfM/blob/6585f0561e7c9d4907eadc7bc2fb9dbdad8a2945/viewer/src/provider/OpensfmDataProvider.js#L328-L338) for a data provider using that as a fallback strategy.

:::

## Contracts and Ents

The most important ent for the data provider is the [ImageEnt](/api/interfaces/api.imageent). Each camera capture is represented as an image ent in the provider. While some image ent properties are self explanatory, we will go through a few that are a bit more involved. While many other contracts and ents need to be served from the provider, they are not as complex so we refer to the [API reference](/api/modules/api#interfaces) for information about those.

### Camera Type and Parameters

MapillaryJS supports three camera types. They map directly to the camera types defined and used in [OpenSfM](https://www.opensfm.org/docs/geometry.html?highlight=models#camera-models).

| Camera Type | Camera Parameters |
| --- | --- |
| [Perspective](https://www.opensfm.org/docs/geometry.html?highlight=perspective#perspective-camera) | `[focal, k1, k2]` |
| [Fisheye](https://www.opensfm.org/docs/geometry.html?highlight=fisheye#fisheye-camera) | `[focal, k1, k2]` |
| [Spherical](https://www.opensfm.org/docs/geometry.html?highlight=spherical#spherical-camera) | `[]` (No parameters) |

The order of the camera parameters must be retained. Any other camera type will be treated as perspective.

### Exif Orientation

Describes the [rotation](https://www.opensfm.org/docs/geometry.html?highlight=orientation#upright-coordinates) of the camera capture.

### Computed Rotation

Internally, MapillaryJS operates in a [local topocentric East, North, Up (ENU)](/docs/theory/coordinates#conversion) reference frame.

If your data is transformed into another coordinate system, you need to apply the inverse of that transform to the [angle-axis representation](https://en.wikipedia.org/wiki/Axis%E2%80%93angle_representation) for each camera capture.

In our procedural provider we want all cameras to look to north, so we use the `[Math.PI / 2, 0, 0]` angle-axis rotation for the camera reference to world reference frame transform.

### Computed vs Original

When running a Structure from Motion algorithm, EXIF GPS positions and other metadata are often used as priors. The algorithm will then improved the positioning of the camera captures. Properties prefixed with `computed` in MapillaryJS refers to output from an algorithm. Properties prefixed `original` referse to metadata from the capture device. If you do not have original metadata, you can just set it to the computed value.

### Merge ID

The merge ID informs MapillaryJS what camera captures should be treated as a connected component and therefore have smooth transitions between them. In our example, we give all cameras the same merge ID.

### Mesh, Thumb and Cluster

All the nested object used by MapillaryJS to request additional data are [URLEnts](/api/interfaces/api.urlent).

```js
const thumb = {id: '<my-thumb-id', url: '<my-thumb-url>'};
```

When requesting the data from the provider, MapillaryJS will only provide the URL as parameter and the provider needs to act based on that. MapillaryJS expects JSON objects and array buffers to be returned from the data provider and exposes the [decompress](/api/modules/api#decompress), [fetchArrayBuffer](/api/modules/api#fetcharraybuffer), and [readMeshPbf](/api/modules/api#readmeshpbf) functions for convenience.

Meshes are provided per camera capture with coordinates in the camera reference frame.

### Conversion

Your data format may not have exactly the same property structure that MapillaryJS expects. In that case you can implement a [converter](https://github.com/mapillary/OpenSfM/blob/6585f0561e7c9d4907eadc7bc2fb9dbdad8a2945/viewer/src/provider/DataConverter.js) to convert the data before providing it to MapillaryJS.

## Camera Capture Generation

We want to visualize all the three [camera types](/docs/extension/procedural-data-provider#camera-type-and-parameters) that MapillaryJS supports with camera parameters specified like so.

```js
const cameraTypes = [
  {
    cameraType: 'fisheye',
    focal: 0.45,
    k1: -0.006,
    k2: 0.004,
  },
  {
    cameraType: 'perspective',
    focal: 0.8,
    k1: -0.13,
    k2: 0.07,
  },
  {
    cameraType: 'spherical',
  },
];
```

## Implementing the Provider

Now that we have generated the data, we need to extend the abstract [DataProviderBase class](/api/classes/api.dataproviderbase).

:::tip

When debugging your data provider, it is a good idea to call the methods directly to ensure that they return correctly converted ents and contracts before attaching it to the Viewer.

:::

### `constructor`

We populate the generated data in the constructor. Here we also generate geometry cells mapping a geo cell to an array of images.

```js
class ProceduralDataProvider extends DataProviderBase {
  constructor() {
    super(new S2GeometryProvider());

    const {images, sequences} = generateImages();
    this.images = images;
    this.sequences = sequences;
    this.cells = generateCells(images, this._geometry);
  }
```

### `getCluster`

We do not generate any point clouds for this example so we return empty clusters.

```js
class ProceduralDataProvider extends DataProviderBase {
  // ...
  getCluster(url) {
    return Promise.resolve({points: {}, reference: REFERENCE});
  }
}
```

For this example, we return the complete image contract because we already have the generated data. For bandwidth, latency, and performance reasons in production, it is recommended to only request the [CoreImageEnt](/api/interfaces/api.coreimageent) properties from the service.

### `getCoreImages`

```js
class ProceduralDataProvider extends DataProviderBase {
  // ...
  getCoreImages(cellId) {
    const images = this.cells.has(cellId) ? this.cells.get(cellId) : [];
    return Promise.resolve({cell_id: cellId, images});
  }
}
```

We generate our mango image buffer on the fly.

### `getImageBuffer`

```js
class ProceduralDataProvider extends DataProviderBase {
  // ...
  getImageBuffer(url) {
    return generateImageBuffer();
  }
}
```

### `getImages`

If an image has been generated, we return it as a node contract.

```js
class ProceduralDataProvider extends DataProviderBase {
  // ...
  getImages(imageIds) {
    const images = imageIds.map((id) => ({
      node: this.images.has(id) ? this.images.get(id) : null,
      node_id: id,
    }));
    return Promise.resolve(images);
  }
}
```

### `getImageTiles`

We will deactivate the image tiling functionality with a viewer option so we do not need to implement this method (we can omit this code completely).

```js
class ProceduralDataProvider extends DataProviderBase {
  // ...
  getImageTiles(tiles) {
    return Promise.reject(new MapillaryError('Not implemented'));
  }
}
```

### `getMesh`

We do not generate any triangles for this example so we return empty meshes.

```js
class ProceduralDataProvider extends DataProviderBase {
  // ...
  getMesh(url) {
    return Promise.resolve({faces: [], vertices: []});
  }
}
```

### `getSequence`

If a sequence has been generated, we return it.

```js
class ProceduralDataProvider extends DataProviderBase {
  // ...
  getSequence(sequenceId) {
    return new Promise((resolve, reject) => {
      if (this.sequences.has(sequenceId)) {
        resolve(this.sequences.get(sequenceId));
      } else {
        reject(new Error(`Sequence ${sequenceId} does not exist`));
      }
    });
  }
}
```

### `getSpatialImages`

We reuse the previously implemented `getImages` method.

```js
class ProceduralDataProvider extends DataProviderBase {
  // ...
  getSpatialImages(imageIds) {
    return this.getImages(imageIds);
  }
}
```

## Attaching the Provider

Now that we have implemented our procedural data provider, we just need to attach it to the [Viewer](/api/classes/viewer.viewer-1) through the ViewerOptions.[dataProvider](/api/interfaces/viewer.vieweroptions#dataprovider) option. Lastly, we need to move to one of the image ids in our generated data to initialize the Viewer.

:::tip

Try changing some of the viewer options, e.g. setting the camera controls to `Street` to get another perspective.

:::

```jsx live
function render(props) {
  let viewer;

  function init(opts) {
    const {container} = opts;

    const imageId = 'image|fisheye|0';
    const dataProvider = new procedural.ProceduralDataProvider();
    const options = {
      dataProvider,
      cameraControls: CameraControls.Earth,
      component: {
        cover: false,
        spatial: {cameraSize: 0.5, cellGridDepth: 3, cellsVisible: true},
      },
      container,
      imageTiling: false,
    };
    viewer = new Viewer(options);
    viewer.moveTo(imageId).catch(mapillaryErrorHandler);
  }

  function dispose() {
    if (viewer) {
      viewer.remove();
    }
  }

  return (
    <ViewerComponent init={init} dispose={dispose} style={{height: '500px'}} />
  );
}
```

## Recap

Now you know how to provide MapillaryJS with your own data by:

- Extending the `DataProviderBase` class and implementing its abstract methods
- Convert your data to the MapillaryJS ent format
- Attach your custom data provider to the MapillaryJS viewer

:::info

You can view the complete code in the [Procedural Data Provider](/examples/procedural-data-provider) example.

If you want to build a data provider fetching files from a server, you can use the [OpenSfM data provider](https://github.com/mapillary/OpenSfM/blob/6585f0561e7c9d4907eadc7bc2fb9dbdad8a2945/viewer/src/provider/OpensfmDataProvider.js) as inspiration.

:::
