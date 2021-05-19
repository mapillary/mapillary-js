---
id: extend
title: Extend MapillaryJS
---

MapillaryJS is a street imagery and semantic mapping visualization platform on the web. It is built from smaller units and some of them can be overridden by custom implementations. To make this possible, MapillaryJS exposes a set of extension APIs.

- [Data Provider API](/api/classes/api.dataproviderbase)
- [Custom Render API](/api/interfaces/viewer.icustomrenderer)
- [Custom Camera Control API](/api/interfaces/viewer.icustomcameracontrols)

By the end of this section, you will be able to use these APIs to extend and augment the MapillaryJS experience with your own data, semantic meshes, 3D models, camera controls, and interactivity.

:::info You will learn

- [How to write a data provider to render your own data in MapillaryJS](/docs/extension/procedural-data-provider)
- [How to write a geometry provider optimized for your geo shapes and queries](/docs/extension/geometry-provider)
- [How to render 3D objects using WebGL](/docs/extension/webgl-custom-renderer)
- [How to render 3D objects using Three.js](/docs/extension/three-custom-renderer)
- [How to create animations](/docs/extension/animation)
- [How to attach camera controls leveraging Three.js](/docs/extension/fly-controls)

:::

## Custom Rendering

The custom render guides focus on rendering specific custom objects onto the MapillaryJS street imagery. It is worth noting that anything you can render with WebGL or Three.js in another context, you can also render inside the MapillaryJS. The inverse is also true, if you render some object in MapillaryJS, you can reuse that object in a WebGL or Three.js application somewhere else. To summarize, your 3D objects are reusable.
