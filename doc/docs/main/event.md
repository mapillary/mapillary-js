---
id: event
title: Event Handling
---

`Viewer` and other MapillaryJS classes emit [events](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events) in response to user interactions or changes in state. You can listen to these events and use the event data to make decisions relevant to your application. In this guide we will register event handler to `Viewer` event types and act upon these events.

:::info You will learn

- How to listen to `Viewer` events
- What types of events the viewer emits
- How to retrieve additional information from the viewer when handling state events

:::

## Register Handlers

`Viewer` is an event emitter. As such, it exposes the Viewer.[on](/api/classes/viewer.viewer-1/#on) method which can be called to register event handlers. Each event handler is registered to a specific [ViewerEventType](/api/modules/viewer/#viewereventtype).

Let's start by registering an event handler for the `load` event. The load event is fired immediately after all necessary resources have been downloaded and the first visually complete rendering of the viewer has occurred. We can listen to it to initialize application specific functionality and resources on `Viewer` load.

```js
const viewer = new Viewer({accessToken, container});

viewer.on('load', (event) => console.log(`'${event.type}'`));
```

The `load` event is state event that emits an object with two properties, the [type](/api/interfaces/viewer.viewerstateevent#type) and the [target](/api/interfaces/viewer.viewerstateevent#target). The target is the object instance that emitted the event, in this case the viewer.

We can listen to other state events too. Let's take a look at the `position` event. It is fired when the viewer's position changes. We can use the Viewer.[getPosition](/api/classes/viewer.viewer-1/#getposition) to get the position and use it in our application.

```js
const viewer = new Viewer({accessToken, container});

viewer.on('position', async (event) => {
  const position = await viewer.getPosition();

  const lng = position.lngLat.lng;
  const lat = position.lngLat.lat;
  console.log(`id: ${imageId}', lng: ${lng}, lat: ${lat}`);
});
```

We can also listen to the `dataloading` event to understand if the `Viewer` is currently loading data for a navigation request.

```js
const viewer = new Viewer({accessToken, container});

viewer.on('dataloading', (event) => {
  console.log(`'${event.type}' - loading: ${event.loading}`);
});
```

We can also listen to viewpoint events that give us information about the viewer camera. The `bearing` event is fired when the viewing direction of the camera changes. We can use the ViewerBearingEvent.[bearing](/api/interfaces/viewer.viewerbearingevent#bearing) property directly to update our application state.

```js
const viewer = new Viewer({accessToken, container});

viewer.on('bearing', (event) => {
  console.log(`'${event.type}' - bearing: ${event.bearing}`);
});
```

## Image Event

The [Image](/api/classes/viewer.image/) class is an important entity in MapillaryJS. Whenever we navigate in the viewer, images are used to represent the current position and visual appearance. We can listen to the `image` event and use the [ViewerImageEvent](/api/interfaces/viewer.viewerimageevent/) object to display information about the current image.

```jsx live
function render(props) {
  let viewer;
  const style = {height: '400px'};
  const imageId = '177438650974210';
  function dispose() {
    if (viewer) {
      viewer.remove();
    }
  }

  function init(options) {
    viewer = new Viewer(options);
    viewer.moveTo(imageId).catch(mapillaryErrorHandler);

    function createThumb(container) {
      const img = document.createElement('img');
      img.style.position = 'absolute';
      img.style.right = '0';
      img.style.width = '200px';
      img.style.border = '1px solid #888';
      container.appendChild(img);
      return img;
    }

    const thumb = createThumb(options.container);
    const onImage = (event) => {
      const image = event.image;
      thumb.src = image.image.src;
    };
    viewer.on('image', onImage);
  }

  return <ViewerComponent init={init} dispose={dispose} style={style} />;
}
```

## Pointer Events

We can listen to a number of [pointer events](/api/interfaces/viewer.viewermouseevent/#type). These events are fired when users move or use their mouse in the viewer HTML container. All pointer events emit [ViewerPointerEvent](/api/interfaces/viewer.viewermouseevent/) objects.

```js
const viewer = new Viewer({accessToken, container});

const onPointerEvent = (event) => {
  const lng = event.lngLat ? event.lngLat.lng : null;
  const lat = event.lngLat ? event.lngLat.lat : null;
  console.log(`'${event.type}' - lng: ${lng}, lat: ${lat}`);
};

viewer.on('dblclick', onPointerEvent);
viewer.on('mousemove', onPointerEvent);
```

The pointer event objects have three coordinate properties that we can use.

1. ViewerPointerEvent.[pixelPoint](/api/interfaces/viewer.viewermouseevent/#pixelpoint) - The pixel coordinates in the viewer container of the mouse event target
1. ViewerPointerEvent.[basicPoint](/api/interfaces/viewer.viewermouseevent/#basicpoint) - The geodetic location in the viewer of the mouse event target
1. ViewerPointerEvent.[lngLat](/api/interfaces/viewer.viewermouseevent/#lnglat) - The [basic image coordinates](/docs/theory/coordinates/#basic-image-coordinates) in the current image of the mouse event target

In the live example we will use the pixel coordinates to show a box with the basic coordinates.

:::tip

Try to pan the view and click outside the image.

Can you display the `lngLat` instead of the `basicPoint` in the coordinate container on `click`?

:::

```jsx live
function render(props) {
  let viewer;
  const style = {height: '400px'};
  const imageId = '3044480469113592';
  function dispose() {
    if (viewer) {
      viewer.remove();
    }
  }

  function createCoordinates(container) {
    const div = document.createElement('div');
    div.style.position = 'absolute';
    div.style.padding = '4px';
    div.style.border = '1px solid #888';
    div.style.background = 'rgb(4, 203, 98)';
    div.textContent = 'Click in viewer';
    container.appendChild(div);
    return div;
  }

  function init(options) {
    viewer = new Viewer(options);
    viewer.moveTo(imageId).catch(mapillaryErrorHandler);

    const coordinates = createCoordinates(options.container);
    const onClick = (event) => {
      const [pixelX, pixelY] = event.pixelPoint;
      coordinates.style.left = `${pixelX}px`;
      coordinates.style.top = `${pixelY}px`;

      if (event.basicPoint) {
        const [basicX, basicY] = event.basicPoint;
        const x = basicX.toFixed(3);
        const y = basicY.toFixed(3);
        coordinates.textContent = `[${x}, ${y}]`;
      } else {
        coordinates.textContent = 'Clicked outside image';
      }
    };
    viewer.on('click', onClick);
  }

  return <ViewerComponent init={init} dispose={dispose} style={style} />;
}
```

## Camera Pose Events

When users interact with the viewer, for example by panning, zooming, or navigating, the viewpoint, position, and other camera pose properties changes. We can register event handlers to listen and act on these changes. For the live example below we will listen to the `pov` event and use the `Viewer` bearing to update a compass north indicator.

We call the Viewer.[getPointOfView](/api/classes/viewer.viewer-1/#getpointofview) method in our event handler and use the PointOfView.[bearing](/api/interfaces/viewer.pointofview#bearing) property to rotate our north indicator.

:::tip

Can you use the `tilt` property of the [PointOfView](/api/interfaces/viewer.pointofview#tilt) object to rotate the north indicator around another axis?

:::

```jsx live
function render(props) {
  let viewer;
  const style = {height: '400px'};
  const imageId = '759648058043947';
  function dispose() {
    if (viewer) {
      viewer.remove();
    }
  }

  function createNorth(container) {
    const div = document.createElement('div');
    div.style.position = 'absolute';
    div.style.right = '38px';
    div.style.top = '18px';
    div.style.width = '0';
    div.style.height = '0';
    div.style.borderLeft = '30px solid transparent';
    div.style.borderRight = '30px solid transparent';
    div.style.borderBottom = '100px solid rgb(4, 203, 98)';
    div.style.filter = 'drop-shadow(0px 0px 1px rgb(0 0 0 / 80%))';
    container.appendChild(div);
    return div;
  }

  function init(options) {
    viewer = new Viewer(options);
    viewer.moveTo(imageId).catch(mapillaryErrorHandler);

    const north = createNorth(options.container);
    const onPov = async (event) => {
      const pov = await event.target.getPointOfView();
      north.style.transform = `rotateZ(${-pov.bearing}deg)`;
    };
    viewer.on('pov', onPov);
  }

  return <ViewerComponent init={init} dispose={dispose} style={style} />;
}
```

## Remove Handlers

When we do not need to listen to a specific event type any more, we call the Viewer.[off](/api/classes/viewer.viewer-1/#off) method to remove our event handler.

```js
const viewer = new Viewer({accessToken, container});

const onImage = (event) {
  const imageId = event.image.id;
  console.log(`id: ${imageId}'`);
};

viewer.on('image', onImage);

// ...
// Remove event handler at a later time
viewer.off('image', onImage);
```

:::info

You can view more event handling code in the [Viewer Events](/examples/viewer-events) example.

:::

## Recap

Now you know how to:

- Register event handlers to listen to `Viewer` events
- Use the properties of the event objects
- Retrieve additional data by calling the `Viewer` methods for state events
- Remove your event handlers when you do not need to listen anymore
