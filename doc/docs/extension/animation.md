---
id: animation
title: Animation
---

In the Three.js custom renderer guide we rendered a static cube using Three.js. What if we want to rotate or move things around inside MapillaryJS? Well, we can do that too, we just have to add a few lines of code to our cube renderer.

:::info You will learn

- How to animate objects in MapillaryJS
- How to trigger rerender to ensure that the animation continues

:::

## Creating the Animation Renderer

We will add functionality to the cube renderer from the [Three.js Renderer](/docs/extension/three-custom-renderer) guide so make sure that you have to study that before jumping into this example. Here we will just go through the new functionality that we will add.

### Specifying the Rotation Speed

We want to be able to change the rotation speed of our cube, so we add a `rotationSpeed` property.

```js
const cube = {
  // ...
  rotationSpeed: 1,
};
```

### Keeping the Time

We will add a Three.js [Clock](https://threejs.org/docs/index.html?q=clock#api/en/core/Clock) member to our renderer. The clock will be readonly so we assign it in the constructor.

```js
class RotatingCubeRenderer {
  constructor(cube) {
    // ...
    this.clock = new Clock();
  }
}
```

### Storing a Viewer Reference

We will make use of the viewer in the `render` method so we store a reference to it through the `viewer` parameter of `onAdd`.

```js
class RotatingCubeRenderer {
  // ...
  onAdd(viewer, reference, context) {
    this.viewer = viewer;
    // ...
  }
}
```

### Trigger Rerender

Our `onReference` and `onRemove` implementations remain the same, so let's move on to the `render` method. Here we make use of the clock to rotate the cube mesh according to our rotation speed and the elapsed time between each animation frame.

Finally, we call the Viewer.[triggerRerender](/api/classes/viewer.viewer-1#triggerrerender) method to force the `Viewer` to rerender and call our render implementation on every animation frame. We need to trigger rerender on every animation frame because we want our cube to rotate indefinitely.

```js
class RotatingCubeRenderer {
  // ...
  render(context, viewMatrix, projectionMatrix) {
    const {camera, clock, scene, cube, renderer, viewer} = this;

    const delta = clock.getDelta();
    const {rotationSpeed} = cube;
    cube.mesh.rotateZ(rotationSpeed * delta);
    cube.mesh.rotateY(0.7 * rotationSpeed * delta);

    // ...

    viewer.triggerRerender();
  }
}
```

:::note

Rerendering on every frame has a performance impact. Whenever it is possible, for example if your animation has completed, it is advices to avoid triggering rerender.

:::

## Adding the Renderer

Now that we have implemented our rotating cube renderer, we just need to add it to the `Viewer` through the Viewer.[addCustomRenderer](/api/classes/viewer.viewer-1#addcustomrenderer) method.

:::tip

Try changing the cube's rotation speed.

:::

```jsx live
function render(props) {
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
      mesh: animation.makeCubeMesh(),
      rotationSpeed: 1,
    };
    const cubeRenderer = new animation.RotatingCubeRenderer(cube);
    viewer.addCustomRenderer(cubeRenderer);

    viewer.moveTo('H_g2NFQvEXdGGyTjY27FMA').catch(mapillaryErrorHandler);
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

- To animate objects in MapillaryJS, use the elapsed time when applying object transforms
- Trigger rerender to ensure that the animation continues
- Avoid triggering rerender if your animation has completed to optimize resource usage

:::info

You can view the complete code in the [Animation](/examples/animation) example.

:::
