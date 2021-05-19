---
id: three-custom-renderer
title: Three.js Renderer
---

In the WebGL custom renderer guide we rendered a cube using the WebGL API directly. This worked well, but we had to write a lot of code to create and bind buffers, compiling shaders etc. With a higher level 3D library like [Three.js](https://github.com/mrdoob/three.js/) we can achieve the same thing but a bit more effiently.

:::info You will learn

- How to use Three.js to render 3D objects directly into the MapillaryJS rendering context
- How to implement the `ICustomRenderer` interface by leveraging the Three.js functionality
- How to add your renderer to the `Viewer`

:::

## Creating a 3D Object

We will use the Three.js [BoxGeometry](https://threejs.org/docs/?q=boxgeom#api/en/geometries/BoxGeometry) to define the shape of our cube. We use an array of materials to give each face of the cube [Mesh](https://threejs.org/docs/?q=mesh#api/en/objects/Mesh) a different color.

```js
function makeCubeMesh() {
  const geometry = new BoxGeometry(2, 2, 2);
  const materials = [
    new MeshBasicMaterial({
      color: 0xffff00,
    }),
    new MeshBasicMaterial({
      color: 0xff00ff,
    }),
    new MeshBasicMaterial({
      color: 0x00ff00,
    }),
    new MeshBasicMaterial({
      color: 0x0000ff,
    }),
    new MeshBasicMaterial({
      color: 0xffffff,
    }),
    new MeshBasicMaterial({
      color: 0xff0000,
    }),
  ];
  return new Mesh(geometry, materials);
}
```

### Geo Coordinates

Entities rendered in MapillaryJS have geodetic coordiantes (or have a position relative to a geodetic reference coordinate) so we set the cube's geo position. The mesh position is initialized to the origin, we will soon change that.

```js
const cube = {
  geoPosition: {
    alt: 1,
    lat: -25.28268614514251,
    lng: -57.630922858385,
  },
  mesh: makeCubeMesh(),
};
```

That's everything we need to start implementing our custom renderer.

## Creating the Custom Renderer

To create our custom renderer, we will implement the [ICustomRenderer](/api/interfaces/viewer.icustomrenderer) interface.

Let us go through it member by member.

### `constructor`

We can use the constructor to assign readonly properties of our renderer. Every custom renderer needs to have a unique ID and specify its render pass (currently the only supported render pass is `Opaque`). Our cube will also be readonly so we assign it in the constructor as well.

```js
class ThreeCubeRenderer {
  constructor(cube) {
    this.id = 'three-cube-renderer';
    this.renderPass = RenderPass.Opaque;
    this.cube = cube;
  }
  // ...
}
```

### `onAdd`

ICustomRenderer.[onAdd](/api/interfaces/viewer.icustomrenderer#onadd) is called when the renderer has been added to the `Viewer` with the Viewer.[addCustomRenderer](/api/classes/viewer.viewer-1#addcustomrenderer) method. This gives your renderer a chance to initialize resources and register event listeners. It is also a chance to calculate the [local topocentric positions](/docs/theory/coordinates#local-topocentric-coordinates) for scene objects using the provided reference.

To calculate the topocentric position of our cube, we will make use of the [geodeticToEnu](/api/modules/api#geodetictoenu) helper function in MapillaryJS and make a position array.

```js
function makePosition(geoPosition, reference) {
  const enuPosition = geodeticToEnu(
    geoPosition.lng,
    geoPosition.lat,
    geoPosition.alt,
    reference.lng,
    reference.lat,
    reference.alt,
  );
  return enuPosition;
}
```

With our helper function, we can calculate and set the local topocentric position of our cube by using the `reference` parameter for the conversion. After that, we will make use of the Three.js [Camera](https://threejs.org/docs/?q=camera#api/en/cameras/Camera), [Scene](https://threejs.org/docs/?q=scene#api/en/scenes/Scene) and [WebGLRenderer](https://threejs.org/docs/?q=webglren#api/en/renderers/WebGLRenderer) classes to prepare for the animation frames where we will render the cube.

We first get the `Viewer` canvas and use the `context` parameter to setup our renderer. We do not want to clear the canvas before rendering our cube (that would erase the street imagery visualization) so we deactivate the `autoClear` functionality.

After that we create the camera we will use for rendering. We will manually update the `viewMatrix` of the camera so we deactivate the `matrixAutoUpdate` functionality.

At last, we create our scene and add the cube mesh to it.

```js
class ThreeCubeRenderer {
  // ...
  onAdd(viewer, reference, context) {
    const position = makePosition(this.cube.geoPosition, reference);
    this.cube.mesh.position.fromArray(position);

    const canvas = viewer.getCanvas();
    this.renderer = new WebGLRenderer({
      canvas,
      context,
    });
    this.renderer.autoClear = false;

    this.camera = new Camera();
    this.camera.matrixAutoUpdate = false;

    this.scene = new Scene();
    this.scene.add(this.cube.mesh);
  }
}
```

### `onReference`

While we will only operate in a small area around the cube with our renderer, MapillaryJS operates on global earth scale. For different reasons, e.g. to ensure numeric stability by keeping topocentric coordinates sufficiently small, MapillaryJS will sometimes update its internal reference geo coordinate used to convert coordinates from geodetic to local topocentric reference. Whenever it updates the reference, it will notify our renderer by calling the ICustomRenderer.[onReference](/api/interfaces/viewer.icustomrenderer#onreference) method so that we can act accordingly and recalculate our cube position. This does not mean the the cube moves relative to the street imagery. Instead, the earth sphere that MapillaryJS operates on has been rotated and we need to adjust everything we want to render accordingly.

```js
class ThreeCubeRenderer {
  //...
  onReference(viewer, reference) {
    const position = makePosition(this.cube.geoPosition, reference);
    this.cube.mesh.position.fromArray(position);
  }
}
```

### `onRemove`

ICustomRenderer.[onRemove](/api/interfaces/viewer.icustomrenderer#onremove) is called when the renderer has been removed from the `Viewer` with the Viewer.[removeCustomRenderer](/api/classes/viewer.viewer-1#addcustomrenderer) method. This gives us a chance to clean up our Three.js resources (and potential event listeners etc).

```js
class ThreeCubeRenderer {
  //...
  onRemove(_viewer, _context) {
    this.cube.mesh.geometry.dispose();
    this.cube.mesh.material.forEach((m) => m.dispose());
    this.renderer.dispose();
  }
}
```

### `render`

ICustomRenderer.[render](/api/interfaces/viewer.icustomrenderer#render) is called during every animation frame that is run. It allows our renderer to draw into the WebGL context.

:::note

When the Viewer is halted, i.e. when no motion such as translation or rotation is performed, the animation frames are not run and therefore the `render` method will not be called. See the [Animation](/docs/extension/animation) example for guidance into how to force all animation frames to be run and the render method to be called on every frame.

:::

The render method provides the `viewMatrix` and `projectionMatrix` as parameters. The `viewMatrix` inverse is equivalent to the Three.js camera matrix so we set the camera matrix from our array and invert it using the Three.js matrix math. After setting the camera matrix it is important to make a call to `updateMatrixWorld` to ensure that all the internal camera matrices are synchronized. We also set the camera projection matrix from our `projectionMatrix` array.

Finally, we reset the renderer state to ensure that previous buffers etc. are cleared before our call to render the scene with our camera.

```js
class ThreeCubeRenderer {
  //...
  render(context, viewMatrix, projectionMatrix) {
    const {camera, scene, renderer} = this;
    camera.matrix.fromArray(viewMatrix).invert();
    camera.updateMatrixWorld(true);
    camera.projectionMatrix.fromArray(projectionMatrix);

    renderer.resetState();
    renderer.render(scene, camera);
  }
}
```

### Additional Functionality

In our custom renderer we only have a single fixed cube that is always visible. Maybe you want to add and remove objects dynamically, change object positions, or change object appearance during the lifespan of the renderer and application. To do that, you can add additional methods and functionality to your renderer class directly or in helpers.

:::note

As of this writing, MapillaryJS will always render the street imagery layer as a background. Occlusion between custom rendered objects and the street imagery will never occur, custom rendered objects will always be rendered on top of the street imagery. You can eperiment with transparency to assert object placement.

:::

## Adding the Renderer

Now that we have implemented our custom cube renderer, we just need to add it to the `Viewer` through the Viewer.[addCustomRenderer](/api/classes/viewer.viewer-1#addcustomrenderer) method.

:::tip

Try changing box geometry size and cube face colors.

:::

```jsx live
function render(props) {
  function makeCubeMesh() {
    const geometry = new three.BoxGeometry(2, 2, 2);
    const materials = [
      new three.MeshBasicMaterial({
        color: 0xffff00,
      }),
      new three.MeshBasicMaterial({
        color: 0xff00ff,
      }),
      new three.MeshBasicMaterial({
        color: 0x00ff00,
      }),
      new three.MeshBasicMaterial({
        color: 0x0000ff,
      }),
      new three.MeshBasicMaterial({
        color: 0xffffff,
      }),
      new three.MeshBasicMaterial({
        color: 0xff0000,
      }),
    ];
    return new three.Mesh(geometry, materials);
  }

  let viewer;

  function init(opts) {
    const {appToken, container} = opts;
    const options = {
      apiClient: appToken,
      component: {cover: false},
      container,
    };
    viewer = new Viewer(options);

    const cube = {
      geoPosition: {
        alt: 1,
        lat: -25.28268614514251,
        lng: -57.630922858385,
      },
      mesh: makeCubeMesh(),
    };
    const cubeRenderer = new threerenderer.ThreeCubeRenderer(cube);
    viewer.addCustomRenderer(cubeRenderer);

    viewer
      .moveTo('H_g2NFQvEXdGGyTjY27FMA')
      .catch((error) => console.error(error));
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

- To add your Three.js 3D objects to MapillaryJS, implement the `ICustomRenderer` interface
- Make sure your objects have a geo position (or a position relative to a geo reference)
- Add your objects to a Three.js `Scene` in your renderer
- Use the Three.js `Camera`, and `WebGLRenderer` classes to render directly into the MapillaryJS rendering context
- Add your custom renderer to the `Viewer`

:::info

You can view the complete example code in the [Three.js Renderer example](/examples/three-renderer).

For more examples of custom renderers using Three.js, you can take a look at the [OpenSfM axes and earth grid renderers](https://github.com/mapillary/OpenSfM/tree/398fe61fd970c7fa80b10b56606643408fa3dd7e/viewer/src/renderer).

:::
