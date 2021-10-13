---
id: graphics-developer
title: Graphics Developer
---

In the Three.js (and the WebGL) custom renderer guide we rendered a cube inside the street imagery map. This worked well, but you may have noticed that the pose of the cube was not completely correct. This happened because the coordinate systems of MapillaryJS and [Three.js differ](https://threejs.org/docs/#api/en/core/Object3D.DefaultUp). If you have worked with platforms like [Unity](https://unity.com) before, you will notice that the [Unity coordinate system](https://docs.unity3d.com/Manual/class-Transform.html) differs from that in MapillaryJS too.

In this guide you will learn how to apply transforms to render your objects with correct position and rotation.

:::info You will learn

- How to discover that a coordinate transformation is needed to render your objects with correct pose
- How to apply a rotation transform to your objets
- How to apply a rotation transform to the MapillaryJS camera view matrix

:::

## Coordinate Transformations

MapillaryJS uses a [right-handed](https://en.wikipedia.org/wiki/Right-hand_rule) [local topocentric](/docs/theory/coordinates#local-topocentric-coordinates) coordinate system where `X`, `Y`, and `Z` corresponds to East, North, and Up. In Three.js on the other hand, `Y` is up and `-Z` is forward by default.

| ENU   | Direction | MapillaryJS | Three.js |
| ----- | --------- | ----------- | -------- |
| East  | Right     | X           | X        |
| North | Forward   | Y           | -Z       |
| Up    | Up        | Z           | Y        |

This means that we need to rotate the MapillaryJS coordinates 90 degrees counter-clockwise around the X-axis for them to correspond with the default Three.js coordinate system. We can also go the other way, transforming the Three.js coordinates to MapillaryJS, by applying the inverse transform, i.e. a 90 degree clockwise rotation around the X-axis.

We can create rotation matrices for performing either of those two transformations.

## Discovering Transformation Needs

If you have previously built 3D graphics applications with Three.js or WebGL and try to render your objects in MapillaryJS they may be rendered with the wrong position and rotation. Let's take a look at the live code example below.

In the example the `RawRenderer` creates a cone according to the following code block.

```js
function makeCone() {
  const geometry = new ConeGeometry(2, 6, 8);
  const material = new MeshPhongMaterial({
    color: 0xffff00,
  });
  return new Mesh(geometry, material);
}
```

We translate the cone with the `translation` parameter supplied to the `RawRenderer` constructor. In a Three.js application, we would have expected this cone to be floating upright five meters above the camera frame in the center. Instead, here it is rendered five meters north of the central camera frame pointing to north. This rotation and displacement are typical signs that you need to apply a rotation transform to you object for it to be rendered correctly.

:::tip

Try changing the `X`, `Y`, and `Z` coordinates of the translation to see how the cone moves.

:::

```jsx live
function render(props) {
  let viewer;

  function init(opts) {
    const {container} = opts;

    const imageId = 'image|fisheye|0';
    const dataProvider = new procedural.ProceduralDataProvider({intervals: 2});
    const options = graphics.makeViewerOptions({container, dataProvider});
    viewer = new Viewer(options);
    viewer.moveTo(imageId).catch(mapillaryErrorHandler);

    const renderer = new graphics.RawRenderer({translation: [0, 5, 0]});
    viewer.addCustomRenderer(renderer);
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

We can resolve the rotation and placement error by applying transforms in different ways. We will look at two of them. Let's start with transforming the pose of our object.

## Transforming the Objects

We can create a transformation matrix to transform the coordinates of our Three.js objects to the MapillaryJS coordinate system.

```js
const THREE_TO_MAPILLARY_TRANSFORM = new Matrix4().makeRotationFromEuler(
  new Euler(Math.PI / 2, 0, 0),
);
```

Whenever we compute a topocentric ENU position, the result will be in the MapillaryJS reference frame. This means that we do not need to transform it. If we want to add a translation to our object, we have to apply transform though. We use our transformation matrix to rotate the translation vector before adding it to the object position.

```js
const [x, y, z] = geoToTopocentric(OBJECT_GEO_ANCHOR, reference);
const position = new Vector3(x, y, z);
const translation = originalTranslation
  .clone()
  .applyMatrix4(THREE_TO_MAPILLARY_TRANSFORM);
position.add(translation);
```

The same goes for the rotation of our object. We multiply the original rotation with our transformation matrix to get the rotation in the MapillaryJS coordinate system.

```js
const rotationMatrix = THREE_TO_MAPILLARY_TRANSFORM.clone().multiply(
  new Matrix4().makeRotationFromEuler(originalRotation),
);
const rotation = new Euler().setFromRotationMatrix(rotationMatrix);
```

:::tip

Again, try changing the `X`, `Y`, and `Z` coordinates of the translation to see how the cone moves in a different direction than above.

:::

```jsx live
function render(props) {
  let viewer;

  function init(opts) {
    const {container} = opts;

    const imageId = 'image|fisheye|0';
    const dataProvider = new procedural.ProceduralDataProvider({intervals: 2});
    const options = graphics.makeViewerOptions({container, dataProvider});
    viewer = new Viewer(options);
    viewer.moveTo(imageId).catch(mapillaryErrorHandler);

    const renderer = new graphics.ThreeToMapillaryRenderer({
      translation: [0, 5, 0],
    });
    viewer.addCustomRenderer(renderer);
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

## Transforming the Camera Matrix

Another way to achieve correct object poses is to apply the inverse of the transform we used for translation and rotation of the objects. We create a rotation matrix rotating around the same axis, but the opposite direction.

```js
const MAPILLARY_TO_THREE_TRANSFORM = new Matrix4().makeRotationFromEuler(
  new Euler(-Math.PI / 2, 0, 0),
);
```

Now when we have calculated or topocentric ENU position, we apply the matrix to transform the position to the Three.js coordinate system. We do not need to transform the translation but can add it to the position directly.

```js
const [x, y, z] = geoToTopocentric(OBJECT_GEO_ANCHOR, reference);
const position = new Vector3(x, y, z).applyMatrix4(
  MAPILLARY_TO_THREE_TRANSFORM,
);

position.add(originalTranslation);
```

The rotation is already in the Three.js coordinate system so we can keep it as is.

```js
const rotation = new Euler().copy(originalRotation);
```

The last thing we have to do is to transform the [local transformation matrix](https://threejs.org/docs/?q=object#api/en/core/Object3D.matrix) of the camera. Because our objects a placed in the Three.js coordinate system, our camera must render the objects in this coordinate system too.

```js
const matrix = MAPILLARY_TO_THREE_TRANSFORM.clone().multiply(
  new Matrix4().fromArray(viewMatrix).invert(),
);
```

:::tip

Again, try changing the `X`, `Y`, and `Z` coordinates of the translation to see how the cone moves in a different direction than above.

:::

```jsx live
function render(props) {
  let viewer;

  function init(opts) {
    const {container} = opts;

    const imageId = 'image|fisheye|0';
    const dataProvider = new procedural.ProceduralDataProvider({intervals: 2});
    const options = graphics.makeViewerOptions({container, dataProvider});
    viewer = new Viewer(options);
    viewer.moveTo(imageId).catch(mapillaryErrorHandler);

    const renderer = new graphics.MapillaryToThreeRenderer({
      translation: [0, 5, 0],
    });
    viewer.addCustomRenderer(renderer);
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

## Other Coordinate Systems

Our example deals with the default Three.js coordinate system where `X` is right, `Y` is up, and `-Z` is forward. If your objects exist in a different coordinate system that does not correspond to the right-handed local topocentric ENU coordinates used in MapillaryJS, you will have to create transformation matrices that applies your case.

## Recap

Now you know how to:

- Discover that your models were created in another coordinate system than what is used in MapillaryJS
- Transform the coordinates of your objects to render them correctly
- Transform the MapillaryJS camera matrix to render your objects correctly

:::info

You can view the complete transformation code in the [Graphics Developer](/examples/extend-graphics-developer) example.

:::
