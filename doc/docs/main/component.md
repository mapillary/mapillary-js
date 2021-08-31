---
id: component
title: Working with Components
---

MapillaryJS comes with a specific set of interaction and visualization [components](/api/modules/component#classes). Each component exposes methods that you can use to programatically change their bahavior and they also fire events. You can also customize the [behavior](/api/modules/component#interfaces) of each component at initialization time.

:::info You will learn

- How to activate and deactivate components
- How to configure component behavior
- How to visualize data using component APIs

:::

## Activation and Deactivation

You can activate and deactivate all MapillaryJS [components](/api/modules/component#classes) at any time by passing the component [names](/api/modules/component#componentname) to the Viewer.[activateComponent](/api/classes/viewer.Viewer#activatecomponent) or Viewer.[deactivateComponent](/api/classes/viewer.Viewer#deactivatecomponent) methods.

:::tip

Try activating and deactivating another component by specifying its [component name](/api/modules/component#componentname) in the live editor.

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
  const imageId = '340458257702273';

  // Create bearing checkbox
  const checkbox = document.createElement('input');
  checkbox.setAttribute('type', 'checkbox');
  checkbox.style.pointerEvents = 'none';
  checkbox.checked = true;
  const space = document.createElement('div');
  space.classList.add('button-space');
  space.appendChild(checkbox);
  const toolbar = document.createElement('div');
  toolbar.classList.add('example-editor-toolbar');
  toolbar.style.zIndex = 100;
  toolbar.style.top = '16px';
  toolbar.style.left = '16px';
  toolbar.appendChild(space);

  // Listen to bearing checkbox clicks
  space.addEventListener('click', () => {
    checkbox.dispatchEvent(new MouseEvent('click', {bubbles: false}));
  });
  checkbox.addEventListener('change', (event) => {
    if (event.target.checked) {
      viewer.activateComponent('bearing');
    } else {
      viewer.deactivateComponent('bearing');
    }
  });

  function init(opts) {
    const {accessToken, container} = opts;
    const viewerOptions = {accessToken, container};
    viewer = new Viewer(viewerOptions);
    viewer.moveTo(imageId).catch(mapillaryErrorHandler);
    container.appendChild(toolbar);
  }

  return <ViewerComponent init={init} dispose={dispose} style={style} />;
}
```

## Configuration

In the `Viewer` [initialization](/docs/main/init#component-options) guide we learnt how to configure components at `Viewer` creation time. These [configurations](/api/modules/component#interfaces) can be changed at any later point in time too. We can retrieve any component through the Viewer.[getComponent](/api/classes/viewer.Viewer#getcomponent) method and call the Component.[configure](/api/classes/component.Component#configure) method with a configuration object specifying the properties we want to change.

```jsx live
function render(props) {
  let viewer;
  function dispose() {
    if (viewer) {
      viewer.remove();
    }
  }
  const style = {height: '400px'};
  const imageId = '4165984473444513';

  function init(opts) {
    const {accessToken, container} = opts;
    const viewerOptions = {
      accessToken,
      container,
    };
    viewer = new Viewer(viewerOptions);
    viewer.moveTo(imageId).catch(mapillaryErrorHandler);

    const pointerComponent = viewer.getComponent('pointer');
    pointerComponent.configure({
      dragPan: true,
      scrollZoom: false,
      touchZoom: false,
    });
  }

  return <ViewerComponent init={init} dispose={dispose} style={style} />;
}
```

## Component API

Some components also have their own component specific APIs. Let us take a look at the [PopupComponent](/api/classes/component.PopupComponent) which can be used to add arbitrary HTML content to the `Viewer` anchored to [basic image coordinates](/docs/theory/coordinates#basic-image-coordinates). We can create a [Popup](/api/classes/component.Popup), define its appearance, add it when the user navigates to a specific image, and remove it when the user navigates away from the related image.

:::tip

Try setting the basic point of the sign to another value and see how it moves in the spherical panorama.

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
  const imageId = '300943088210479';

  function init(opts) {
    const {accessToken, container} = opts;
    const viewerOptions = {
      accessToken,
      component: {popup: true},
      container,
    };
    viewer = new Viewer(viewerOptions);
    viewer.moveTo(imageId).catch(mapillaryErrorHandler);

    const popupComponent = viewer.getComponent('popup');

    // Parking sign
    const signText = document.createElement('span');
    signText.style.color = '#000';
    signText.textContent = 'parking sign';
    const sign = new Popup({offset: 10});

    sign.setDOMContent(signText);
    sign.setBasicPoint([0.546, 0.507]);

    viewer.on('image', (event) => {
      if (event.image.id === imageId) {
        popupComponent.add([sign]);
      } else {
        popupComponent.removeAll();
      }
    });
  }

  return <ViewerComponent init={init} dispose={dispose} style={style} />;
}
```

## Recap

Now you know how to use the `Viewer` and its components to:

- Activate or deactivate components after initialization
- Change the behavior of specific components
- Visualize spatial or semantic data and information using the component APIs

:::info

You can view the complete code showing the functionality and APIs of a number of components in the [component](/examples#component) examples section.

:::
