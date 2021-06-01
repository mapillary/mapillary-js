---
id: extend
title: Extend MapillaryJS
---

MapillaryJS is a street imagery and semantic mapping visualization platform on the web. It is built from smaller units and some of them can be augmented or overridden by custom implementations. To make this possible, MapillaryJS exposes a set of extension APIs.

- [Data Provider API](/api/classes/api.dataproviderbase)
- [Custom Render API](/api/interfaces/viewer.icustomrenderer)
- [Custom Camera Control API](/api/interfaces/viewer.icustomcameracontrols)

By the end of this section, you will be able to use these APIs to extend and augment the MapillaryJS experience with your own data, semantic meshes, 3D models, animations, editing capabilities, camera controls, and interactivity.

:::info You will learn

- [How to write a data provider to render your own data in MapillaryJS](/docs/extension/procedural-data-provider)
- [How to write a geometry provider optimized for your geo shapes and queries](/docs/extension/geometry-provider)
- [How to render 3D objects using WebGL](/docs/extension/webgl-custom-renderer)
- [How to render 3D objects using Three.js](/docs/extension/three-custom-renderer)
- [How to create animations](/docs/extension/animation)
- [How to attach camera controls leveraging Three.js](/docs/extension/fly-controls)

:::

## Custom Rendering

The custom render guides focus on rendering specific custom objects onto the MapillaryJS street imagery. It is worth noting that anything you can render with [WebGL](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API) or [Three.js](https://github.com/mrdoob/three.js/) in another context, you can also render inside the MapillaryJS. The inverse is also true, if you render some object in MapillaryJS, you can reuse that object in a WebGL or Three.js application somewhere else. To summarize, your 3D objects are reusable.

### Overview

We go into the details of writing custom renderers in the guides, but the overview below explains how the custom render API works, step by step.

![Custom Render Overview](/img/extension/custom-render-design.png)

_Custom render overview_

The custom render API works like this:

1. We start at the top, in a web application. We want to render our own 3D models and meshes in MapillaryJS. To do that we create a custom renderer class implementing the [ICustomRenderer](/api/interfaces/viewer.icustomrenderer) interface.
2. In our application we instantiate a MapillaryJS viewer and add our custom renderer.
3. When we add our custom renderer, it becomes part of the MapillaryJS render pipeline.
4. Our custom renderer gets notified that it needs to render every time an update occurs. For each update, our ICustomRenderer.[render](/api/interfaces/viewer.icustomrenderer#render) method implementation gets called with the WebGL context, the view matrix, and the projection matrix. We use the matrices to render directly onto the MapillaryJS canvas through the WebGL context.

To dig deeper into the details, take a look at the custom render guides.
