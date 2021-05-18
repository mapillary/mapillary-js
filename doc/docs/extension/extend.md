---
id: extend
title: Extend MapillaryJS
---

MapillaryJS is a street imagery and semantic mapping visualization platform on the web. It is build from smaller units and some of them can be overridden by custom implementations. to enable this, MapillaryJS exposes a set of growing Extension APIs.

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
