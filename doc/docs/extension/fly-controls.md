---
id: fly-controls
title: Three.js Fly Controls
---

MapillaryJS comes with two different camera controls, `Street` and `Earth`. `Street` mode is for navigating at the street level while `Earth` mode works more like a map. When using MapillaryJS, you may want to interact with the visualized content in another way. You can do that by extending MapillaryJS with custom camera controls. Custom camera controls allow you to freely move the viewer's camera and define the camera projection used.

:::info You will learn

- How to use the Three.js fly controls to define the camera behavior
- How to implement the `ICustomCameraControls` interface
- How to attach your camera controls to the `Viewer`
- How to activate your camera controls

:::

## Creating the Camera Controls

In the data provider and custom render examples we worked with both [geodetic](/docs/theory/coordinates#geodetic-coordinates) and [local topocentric](/docs/theory/coordinates#local-topocentric-coordinates) coordinates and converted between them. For camera controls, we mainly operate in the local topocentric space, but will also do some coordiante conversions.

To create our fly controls, we will implement the [ICustomCameraControls](/api/interfaces/viewer.icustomcameracontrols) interface. Let us go through the interface implementation member by member.

### `constructor`

We can use the constructor to assign some readonly visualization options for our controls.

```js
class FlyCameraControls {
  constructor() {
    this.fov = options.fov;
    this.movementSpeed = options.movementSpeed;
    this.rollSpeed = options.rollSpeed;
  }
  // ...
}
```

### `onAttach`

ICustomCameraControls.[onAttach](/api/interfaces/viewer.icustomcameracontrols#onattach) is called when the controls have been attached to the `Viewer` with the Viewer.[attachCustomCameraControls](/api/classes/viewer.Viewer#attachcustomcameracontrols) method. `onAttach` provides two important callback parameters, `viewMatrixCallback` and `projectionMatrixCallback`. You should invoke these callbacks to modify the pose and projection of the `Viewer`'s camera whenever the controls causes an update.

Custom camera controls trigger rerendering automatically when the camera pose or projection is changed through the `viewMatrixCallback` or `projectionMatrixCallback`. Invoking the callbacks has no effect if custom camera controls has not been [activated](/docs/extension/fly-controls#activating-and-deactivating).

In our controls `onAttach` implementation, we assign the callback parameters to instance properties to be able to invoke them later.

:::tip

If you want to learn more about view, and projection matrices, take a look at the [WebGL model view projection article](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_model_view_projection) on MDN.

:::

```js
class FlyCameraControls {
  // ...
  onAttach(viewer, viewMatrixCallback, projectionMatrixCallback) {
    this.viewMatrixCallback = viewMatrixCallback;
    this.projectionMatrixCallback = projectionMatrixCallback;
  }
}
```

### `onActivate`

When our controls are activated, they take responsibility for moving the `Viewer`'s camera and defining it's projection. The ICustomCameraControls.[onActivate](/api/interfaces/viewer.icustomcameracontrols#onactivate) method gives the camera controls a chance to initialize resources, perform any transitions, and determine initial state.

`onActivate` provides four parameters that we can use for initialization. Let's go through the matrix parameters in detail.

#### `viewMatrix`

The `viewMatrix` array contains the `Viewer` view matrix entries for the moment our controls were activated. We can use the entries of the `viewMatrix`, and particularly the `viewMatrix` inverse, to determine initial properties such as eye, forward, and up vectors. We can also use them to transition smoothly so another position.

#### `projectionMatrix`

Simpilar to the `viewMatrix`, the `projectionMatrix` array contains the `Viewer` projection matrix entries for the moment our controls were activated. We can use the projection matrix entries to determine the initial projection if we want a smooth transition.

#### Implementation

Our `onActivate` implementation consist of the following steps.

1. We save the geodetic reference for the future in case it changes.
2. We use the Viewer.[getContainer](/api/classes/viewer.Viewer#getcontainer) method to get the container for determining the viewer aspect and create a [PerspectiveCamera](https://threejs.org/docs/index.html?q=perspe#api/en/cameras/PerspectiveCamera). We want up to correspond to the Z-axis initially so we rotate the camera 90 degrees.
3. We create the fly controls, providing the camera and the container for attaching event handlers (which happens in the Three.js FlyControls constructor).
4. We use the `viewMatrix` inverse to set the initial camera position to the current `Viewer` position.
5. We create an event listener invoking the `viewMatrixCallback` whenever the controls emits a change.
6. Finally, we invoke the callbacks to update the `Viewer` camera with our initialized view and projection matrices. Note that we make sure to update both matrices properly before invoking the callbacks.

```js
class FlyCameraControls {
  // ...
  onActivate(viewer, viewMatrix, projectionMatrix, reference) {
    this.reference = reference;

    const {fov, movementSpeed, rollSpeed} = this;

    // Create camera
    const container = viewer.getContainer();
    const aspect = calcAspect(container);
    const camera = new PerspectiveCamera(fov, aspect, 0.1, 10000);
    camera.rotateX(Math.PI / 2);

    // Create controls
    this.controls = new FlyControls(camera, container);
    this.controls.movementSpeed = movementSpeed;
    this.controls.rollSpeed = rollSpeed;

    // Set camera position
    const viewMatrixInverse = new Matrix4().fromArray(viewMatrix).invert();
    const me = viewMatrixInverse.elements;
    const translation = [me[12], me[13], me[14]];
    this.controls.object.position.fromArray(translation);

    // Listen to control changes
    this.onControlsChange = () => {
      this.controls.object.updateMatrixWorld(true);
      this.viewMatrixCallback(
        this.controls.object.matrixWorldInverse.toArray(),
      );
    };
    this.controls.addEventListener('change', this.onControlsChange);

    // Update pose and projection
    this.clock = new Clock();
    const delta = this.clock.getDelta();
    this.controls.update(delta);

    camera.updateProjectionMatrix();
    this.projectionMatrixCallback(camera.projectionMatrix.toArray());
  }
}
```

### `onAnimationFrame`

Custom camera controls can choose to make updates on each animation frame or based on input events only. Updating on each animation frame is more resource intensive. We will make a call to update the fly controls on each animation frame. The controls will notify our `change` event listener whenever its pose has changed.

```js
class FlyCameraControls {
  // ...
  onAnimationFrame(_viewer, _frameId) {
    const delta = this.clock.getDelta();
    this.controls.update(delta);
  }
}
```

### `onReference`

Like [custom renderers](/docs/extension/webgl-custom-renderer#onreference), we need to handle updates to the MapillaryJS geodetic reference. We do that in the `onReference` method by first calculating the camera's geodetic coordinates using the previous reference. Then we calculate the new local topocentric east, north, up position using the current reference. We make sure that the camera matrices are updated and the current reference is saved.

```js
class FlyCameraControls {
  // ...
  onReference(viewer, reference) {
    const oldReference = this.reference;

    const enu = this.controls.object.position;
    const [lng, lat, alt] = enuToGeodetic(
      enu.x,
      enu.y,
      enu.z,
      oldReference.lng,
      oldReference.lat,
      oldReference.alt,
    );
    const [e, n, u] = geodeticToEnu(
      lng,
      lat,
      alt,
      reference.lng,
      reference.lat,
      reference.alt,
    );

    this.controls.object.position.set(e, n, u);
    this.controls.object.updateMatrixWorld(true);

    this.reference = reference;
  }
}
```

### `onResize`

Whenever the `Viewer` detects that it is resized, either through [browser resize tracking](/api/interfaces/viewer.vieweroptions#trackresize) or through you informing it with the Viewer.(resize)[/api/classes/viewer.Viewer#resize] method, it will notify our camera controls. This gives us a chance to recalculate the aspect and update the projection matrix.

```js
class FlyCameraControls {
  // ...
  onResize(_viewer) {
    const camera = this.controls.object;
    camera.aspect = calcAspect(this.controls.domElement);
    camera.updateProjectionMatrix();
    this.projectionMatrixCallback(camera.projectionMatrix.toArray());
  }
}
```

### `onDeactivate`

The `onDeactivate` method is called when other camera controls are activated with the Viewer.[setCameraControls](/api/classes/viewer.Viewer#setcameracontrols) method. We use the `onDeactivate` method to dispose the fly controls and remove our event listener. Note that our controls are still attached to the `Viewer` and may be activated again in the future.

```js
class FlyCameraControls {
  // ...
  onDeactivate(_viewer) {
    if (this.controls) {
      this.controls.removeEventListener('change', this.onControlsChange);
      this.controls.dispose();
      this.controls = null;
    }
  }
}
```

### `onDetach`

The `onDetach` method is called when the camera controls have been detached from the viewer by calling Viewer.[detachCameraControls](/api/classes/viewer.Viewer#detachcustomcameracontrols). This gives use a chance to remove the matrix callbacks.

```js
class FlyCameraControls {
  // ...
  onDetach(_viewer) {
    this.projectionMatrixCallback = null;
    this.viewMatrixCallback = null;
  }
}
```

## Attaching and Detaching

Only a single custom camera control instance can be attached to the `Viewer` at any given time. A controls instance is attached with the Viewer.[attachCustomCameraControls](/api/classes/viewer.Viewer#attachcustomcameracontrols) method. Although only a single control instance can be attached at any given time, multiple different controls can be used during the `Viewer` lifespan. By detaching a controls instance with the Viewer.[detachCustomCameraControls](/api/classes/viewer.Viewer#detachcustomcameracontrols) method, another controls instance can be attached.

### Activating and Deactivating

You can activate an attached controls instance in two ways.

1. Use the the ViewerOptions.[cameraControls](/api/interfaces/viewer.vieweroptions#cameracontrols) option to specify the CameraControls.[Custom](/api/enums/viewer.cameracontrols#custom) mode upon initialization.
2. Set the `Custom` mode with the Viewer.[setCameraControls](/api/classes/viewer.Viewer#setcameracontrols) method at any time during the `Viewer` lifespan.

Deactivating the custom controls is done by calling the Viewer.[setCameraControls](/api/classes/viewer.Viewer#setcameracontrols) method with any oother [CameraControls] mode.

## Putting the Controls to Use

Now that we have implemented our custom cube renderer, we just need to add it to the `Viewer` through the Viewer.[addCustomRenderer](/api/classes/viewer.Viewer#addcustomrenderer) method.

:::tip

Press the left button to fly forward and the right button to fly backward or use the [fly key commands](https://github.com/mrdoob/three.js/blob/r125/examples/jsm/controls/FlyControls.js#L57-L76) for specific motion.

Try to intialize the `Viewer` with `Street` or `Earth` controls and change to the `Custom` controls by calling Viewer.`setCameraControls`. Try changing the fly options to see how they affect the viewport and camera behavior.

:::

```jsx live
function render(props) {
  let viewer;

  function init(opts) {
    const {accessToken, container} = opts;

    const imageId = '578479680210256';
    const cameraControls = CameraControls.Custom;
    const options = {
      accessToken,
      cameraControls,
      component: {
        cover: false,
        direction: false,
        spatial: {cameraSize: 0.8, cellsVisible: true, pointSize: 0.2},
      },
      container,
    };
    viewer = new Viewer(options);

    const flyOptions = {
      fov: 90,
      movementSpeed: 30,
      rollSpeed: 0.25,
    };
    const flyControls = new flycontrols.FlyCameraControls(flyOptions);
    viewer.attachCustomCameraControls(flyControls);

    viewer.moveTo(imageId).catch(mapillaryErrorHandler);
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

- To add custom camera controls to MapillaryJS, implement the `ICustomCameraControls` interface
- Setup your controls in the `onActivate` method
- Invoke the `viewMatrix` and `projectionMatrix` callbacks whenever your camera pose or projection is updated
- Make use of any of the Three.js controls if they cover your use case
- Attach your custom camera controls to the `Viewer` and activate `Custom` mode to put them to use

:::info

You can view the complete code in the [Fly Controls](/examples/fly-controls) example.

For another example of custom camera controls leveraging Three.js, you can take a look at the [OpenSfM orbit camera controls](https://github.com/mapillary/OpenSfM/blob/398fe61fd970c7fa80b10b56606643408fa3dd7e/viewer/src/ui/OrbitCameraControls.js).

:::
