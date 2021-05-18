---
id: three-custom-renderer
title: Three.js Renderer
---

Anything you can render with Three.js standalone, you can also render inside the MapillaryJS street imagery context. The opposite is also true, if you can visualize a Three.js Therefore, even if you write a renderer to visualization things, only a minor part of the logic is related to the you are not limited to rendering your objects. The major part of the code you write will be reusable in other contexts that supports rendering Three.js objects.

## Recap

:::info

You can view the complete example code in the [Three.js Renderer example](/examples/three-renderer).

For more examples of custom renderers using Three.js, you can take a look at the [OpenSfM axes and earth grid renderers](https://github.com/mapillary/OpenSfM/tree/398fe61fd970c7fa80b10b56606643408fa3dd7e/viewer/src/renderer).

:::
