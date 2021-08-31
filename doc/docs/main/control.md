---
id: control
title: Controlling the Viewer
---

In the [initialization guide](/docs/main/init) we configured the [Viewer](/api/classes/viewer.Viewer) with options at creation time. In this guide we will control the viewer's behavior and appearance after initialization through the `Viewer`'s API methods.

:::info You will learn

- How to activate and deactivate the _cover_ component
- How to configure the `Viewer` after initialization
- How to filter the street imagery map

:::

## Using the Cover

The MapillaryJS _cover_ is a special component that can be activated and deactivated at any time. When the cover is active, MapillaryJS, does not perform any operations at all. After initialization we use the Viewer.[activateCover](/api/classes/viewer.Viewer#activatecover) and Viewer.[deactivateCover](/api/classes/viewer.Viewer#deactivatecover) methods to show or hide the _cover_.

:::tip

Try tapping the _cover_ activation checkbox to see how it affects the `Viewer`.

:::

```jsx live
function render(props) {
  let viewer;
  function dispose() {
    if (viewer) {
      viewer.remove();
    }
  }

  const style = {height: '400px'};
  const imageId = '205776974704285';

  // Create cover checkbox
  const checkbox = document.createElement('input');
  checkbox.setAttribute('type', 'checkbox');
  checkbox.style.pointerEvents = 'none';
  const space = document.createElement('div');
  space.classList.add('button-space');
  space.appendChild(checkbox);
  const toolbar = document.createElement('div');
  toolbar.classList.add('example-editor-toolbar');
  toolbar.style.zIndex = 100;
  toolbar.style.top = '16px';
  toolbar.style.left = '16px';
  toolbar.appendChild(space);

  // Listen to cover checkbox clicks
  space.addEventListener('click', () => {
    checkbox.dispatchEvent(new MouseEvent('click', {bubbles: false}));
  });
  checkbox.addEventListener('change', (event) => {
    if (event.target.checked) {
      viewer.activateCover();
    } else {
      viewer.deactivateCover();
    }
  });

  function init(opts) {
    const {accessToken, container} = opts;
    const options = {accessToken, container};
    viewer = new Viewer(options);
    viewer.moveTo(imageId).catch(mapillaryErrorHandler);
    container.appendChild(toolbar);
  }

  return (
    <div>
      <ViewerComponent init={init} dispose={dispose} style={style} />
    </div>
  );
}
```

:::note

In the live example we do not sync the checkbox when tapping the MapillaryJS cover image. Calling Viewer.`deactivateCover` when the cover is already deactivated has no effect.

:::

## Behavior and Appearance

```jsx live
function render(props) {
  let viewer;
  function dispose() {
    if (viewer) {
      viewer.remove();
    }
  }

  const style = {height: '400px'};
  const imageId = '821390568809272';

  function init(opts) {
    const {accessToken, container} = opts;
    const options = {accessToken, container};
    viewer = new Viewer(options);
    viewer.moveTo(imageId).catch(mapillaryErrorHandler);

    viewer.setTransitionMode(TransitionMode.Instantaneous);
    viewer.setRenderMode(RenderMode.Letterbox);
  }

  return (
    <div>
      <ViewerComponent init={init} dispose={dispose} style={style} />
    </div>
  );
}
```

## Filtering

Filters are used for specifying which images are part of the MapillaryJS navigation. We can specify filters to ensure that for example `spherical` images, images captured after a certain date, or images belonging to a specific sequence are the only ones shown. The filter is set through the Viewer.[setFilter](/api/classes/viewer.Viewer#setfilter) method and is applied globally. The filter can be cleared by setting it to an empty array.

:::tip

Try filtering on another [camera type](/api/interfaces/api.SpatialImageEnt#camera_type) or [key](/api/modules/viewer#filterkey), and using another [comparison operator](/api/modules/viewer#comparisonfilteroperator).

:::

```jsx live
function render(props) {
  let viewer;
  function dispose() {
    if (viewer) {
      viewer.remove();
    }
  }

  const style = {height: '400px'};
  const imageId = '821390568809272';

  function init(opts) {
    const {accessToken, container} = opts;
    const options = {accessToken, container};
    viewer = new Viewer(options);
    viewer.moveTo(imageId).catch(mapillaryErrorHandler);

    viewer.setFilter(['==', 'cameraType', 'fisheye']);
  }

  return (
    <div>
      <ViewerComponent init={init} dispose={dispose} style={style} />
    </div>
  );
}
```

:::info

You can view more thorough code using the `Viewer` APIs in the [Methods](/examples/viewer-methods) and [Filtering](/examples/viewer-filters) examples. You can also see how to control the `Viewer`'s point and field of view in the [Viewpoint](/examples/viewer-coordinates) example.

:::

## Recap

Now you know how to use the `Viewer`'s APIs to:

- Activate or deactivate the cover component
- Change the behavior of MapillaryJS
- Filter the images that are shown and are part of the navigation
