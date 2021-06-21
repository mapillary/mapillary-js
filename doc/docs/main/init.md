---
id: init
title: Initialization
---

MapillaryJS comes with a core set of street imagery interaction and visualization features. The `Viewer` object represents the street imagery viewer on your web page. It exposes methods that you can use to programatically change the view, and fires events as users interact with it.

You can customize the [Viewer](/api/classes/viewer.Viewer) behavior in different ways. In this guide we will do this at initialization time.

:::info You will learn

- How to activate and deactivate the _cover_
- How to configure the `Viewer` through options
- How to configure _components_ through options

:::

## Using the Cover

The MapillaryJS _cover_ is a special component that can be activated and deactivated at any time. When the cover is active, MapillaryJS, does not perform any operations at all. We can use the [component options](/api/interfaces/viewer.componentoptions) to decide if the [cover](/api/interfaces/viewer.componentoptions#cover) should be active or not when at initialization.

If we specify an image ID in the [viewer options](/api/interfaces/viewer.vieweroptions#imageid), the cover will always be visible initially (but can be hidden automatically through with the `cover: false` component option).

If we do not specify an image ID in the viewer options the cover will be hidden (resulting in a dark background being shown). In this case, we need another way to tell inform the Viewer about the initial image. We can use the Viewer.[moveTo](/api/classes/viewer.Viewer/#moveto) method to do that by calling it with our image ID.

:::tip

Try changing the _cover_ option to `false` to see how it affects `Viewer` initialization.

:::

```jsx live
function render(props) {
  let viewer;
  let coverViewer;
  function dispose() {
    if (viewer) {
      viewer.remove();
    }
  }
  function disposeCover() {
    if (coverViewer) {
      coverViewer.remove();
    }
  }

  const style = {height: '400px', width: '50%', display: 'inline-block'};
  const imageId = '3748064795322267';

  function init(opts) {
    const {accessToken, container} = opts;
    const options = {accessToken, container};
    viewer = new Viewer(options);
    viewer.moveTo(imageId).catch(mapillaryErrorHandler);
  }

  function initCover(opts) {
    const {accessToken, container} = opts;
    const options = {
      accessToken,
      component: {cover: true},
      container,
      imageId,
    };
    coverViewer = new Viewer(options);
  }

  return (
    <div>
      <ViewerComponent init={init} dispose={dispose} style={style} />
      <ViewerComponent init={initCover} dispose={disposeCover} style={style} />
    </div>
  );
}
```

:::info

You can view the complete code for all `Viewer` initialization behaviors in the [Viewer Initialization](/examples/viewer-initialization) example.

:::

## Viewer Options

The [ViewerOptions](/api/interfaces/viewer.vieweroptions) give us a way to control some behaviors. First, we always specify an [access token](/api/interfaces/viewer.vieweroptions#accesstoken) (when working with data from the Mapillary platform) and a [container](/api/interfaces/viewer.vieweroptions#container). The container can be an HTML element ID or an [HTMLDivElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLDivElement).

The other options are optional. We can deactivate things like _image tiling_, _combined panning_, and _resize tracking_. We can also change _render mode_, _transition mode_, and _camera control mode_.

:::tip

Check the difference in pixel resolution when zooming with `imageTiling` set to `true` or `false`.

Try resizing the browser window with `trackResize` set to `true` or `false`. If you set `trackResize` to `false`, you can still programatically inform the `Viewer` that it has been resized by calling the Viewer.[resize](/api/classes/viewer.Viewer#resize) method.

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
  const imageId = '178975760792906';

  function init(opts) {
    const {accessToken, container} = opts;
    const viewerOptions = {
      accessToken,
      cameraControls: CameraControls.Street,
      combinedPanning: false,
      component: {cover: false},
      container,
      imageId,
      imageTiling: false,
      renderMode: RenderMode.Letterbox,
      trackResize: false,
      transitionMode: TransitionMode.Instantaneous,
    };
    viewer = new Viewer(viewerOptions);
  }

  return <ViewerComponent init={init} dispose={dispose} style={style} />;
}
```

## Component Options

The [ComponentOptions](/api/interfaces/viewer.componentoptions) can be used to activate or deactivate all components by specifying a boolean value.

Most components also have a [configuration](/api/modules/component#interfaces). The component configurations give us an opportunity to to do more fine grained component specific configuration. Specifying a component configuration for a component option property means that the component will be activated on initialization in the same way as setting its value to 'true'.

With component options can for example deactivate certain _pointer_ handlers to avoid interfering with the default browser scroll behavior or tell the _sequence_ component to play a sequence immediately on load.

```jsx live
function render(props) {
  let viewer;
  function dispose() {
    if (viewer) {
      viewer.remove();
    }
  }
  const style = {height: '400px'};
  const imageId = '178975760792906';

  function init(opts) {
    const {accessToken, container} = opts;
    const componentOptions = {
      bearing: {size: ComponentSize.Large},
      cache: false,
      cover: false,
      direction: {maxWidth: 300},
      keyboard: {keyZoom: false},
      pointer: {scrollZoom: false},
      sequence: {visible: false, playing: false},
      zoom: true,
    };
    const viewerOptions = {
      accessToken,
      component: componentOptions,
      container,
      imageId,
    };
    viewer = new Viewer(viewerOptions);
  }

  return <ViewerComponent init={init} dispose={dispose} style={style} />;
}
```

:::info

You can view the complete code for all initial `Viewer` behaviors in the [Viewer Initialization](/examples/viewer-initialization) example.

:::

## Recap

Now you know how to initialize the MapillaryJS Viewer with different interaction and visualization features by:

- Activating or deactivating the _cover_ component
- Specifying viewer and component options that changes the behavior of MapillaryJS
