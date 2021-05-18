---
id: geometry-provider
title: Geometry Provider
---

MapillaryJS needs a scalable way to index camera captures when determining adjacency. It uses discrete [S2 geometry cells](https://s2geometry.io/) to solve that in the [S2GeometryProvider](/api/classes/api.s2geometryprovider). If you want to use another geo indexing algorithm, for example when requesting data from a service, you can implement your own geometry provider.

:::info You will learn

- How to create your own geometry provider by extending the `GeometryProviderBase` class
- How to make MapillaryJS use your geometry provider to load adjacent data

:::

## Implementing the Provider

The [GeometryProviderBase](/api/classes/api.geometryproviderbase) class has four abstract methods that you need to implement.

```js
class MyGeometryProvider extends GeometryProviderBase {
    public bboxToCellIds(sw, ne) {
        // ...
    }

    public getAdjacent(cellId) {
        // ...
    }

    public getVertices(cellId) {
        // ...
    }

    public lngLatToCellId(lngLat) {
        // ...
    }
}
```

:::caution

MapillaryJS operates on a metric scale and uses measurments relevant from a street imagery perspective. Returning cells with a size of roughly 10,000 square meters is recommended.

:::

Let us go through them one by one.

### `bboxToCellIds`

Converts a geodetic bounding box to the the minimum set of cell ids containing the bounding box.

### `getAdjacent`

Returns the cell ids of all adjacent cells. In the case of approximately rectangular cells this is typically the eight orthogonally and diagonally adjacent cells.

### `getVertices`

Returns the vertices of the cell outline. The vertices form an unclosed polygon in the 2D longitude, latitude space. No assumption on the position of the first vertex relative to the others can be made.

### `lngLatToCellId`

Converts geodetic coordinates to a cell id.

## Attaching the Provider

Now that we have implemented our geometry provider, we just need to attach it to the Viewer through the data provider. We will use the built in `S2GeometryProvider` and our [procedural data provider](/docs/extension/procedural-data-provider) in the live example.

:::tip

Try to change cell level parameter of the `S2GeometryProvider` constructor to see how it affects the cell size.

:::

```jsx live
function render(props) {
  let viewer;

  function init(opts) {
    const {container} = opts;

    const geometry = new S2GeometryProvider(19);
    const provider = new procedural.ProceduralDataProvider(geometry);
    const options = {
      apiClient: provider,
      cameraControls: CameraControls.Earth,
      component: {
        cover: false,
        image: false,
        spatial: {cameraSize: 0.5, cellGridDepth: 3, cellsVisible: true},
      },
      container,
    };
    viewer = new Viewer(options);
    viewer.moveTo('image|fisheye|0').catch((error) => console.error(error));
  }

  function dispose() {
    if (viewer) {
      viewer.remove();
    }
  }

  return (
    <ViewerComponent init={init} dispose={dispose} style={{height: '400px'}} />
  );
}
```

## Recap

- You can define the geo indexing algorithm used by MapillaryJS by extending the `GeometryProviderBase` class.
- Attach your custom geometry provider to the MapillaryJS viewer through the data provider.

:::note

If you want to request data based on [Geohashes](https://en.wikipedia.org/wiki/Geohash), take a look at the deprecated [GeohashGeometryProvider](https://github.com/mapillary/mapillary-js/blob/56c751a0/src/api/GeohashGeometryProvider.ts).

:::
