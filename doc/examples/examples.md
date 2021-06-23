---
id: examples
title: Examples
slug: /
---

## Support

| Example | Description |
| --- | --- |
| [Check Support](/examples/support) | Verify that the browser [supports](/api/modules/viewer#functions) MapillaryJS |

## Viewer

### Core Functionality

| Example | Description |
| --- | --- |
| [Initialization](/examples/viewer-initialization) | Initialize the viewer in different ways and check if it is [navigable](/api/classes/viewer.viewer-1#isnavigable) |
| [Options](/examples/viewer-options) | Configure appearance and behavior through [viewer](/api/interfaces/viewer.vieweroptions) and [component](/api/interfaces/viewer.componentoptions) options |
| [Methods](/examples/viewer-methods) | Configure appearance and behavior with methods after initial [load](/api/classes/viewer.viewer-1#on) |
| [Events](/examples/viewer-events) | Add event listeners and handle viewer [events](/api/modules/viewer#viewereventtype) |
| [Filtering](/examples/viewer-filters) | Apply [filters](/api/classes/viewer.viewer-1#setfilter) to decide what images are shown and can be navigated to |
| [Viewpoint](/examples/viewer-coordinates) | Control the viewer's [point](/api/classes/viewer.viewer-1#setcenter) and [field](/api/classes/viewer.viewer-1#setzoom) of view |

### Map Synchronization

| Example | Description |
| --- | --- |
| [Viewer to Map](/examples/viewer-to-map) | Update a [Mapbox](https://docs.mapbox.com/mapbox-gl-js/api/) map from viewer [position](/api/classes/viewer.viewer-1#getposition) and [field of view](/api/classes/viewer.viewer-1#getfieldofview) |
| [Map to Viewer](/examples/viewer-from-map) | Navigate the viewer based on [Mapbox](https://docs.mapbox.com/mapbox-gl-js/api/) map interaction |

## Component

### Input

| Example | Description |
| --- | --- |
| [Pointer](/examples/component-pointer) | Activate and deactivate pan and zoom [pointer handlers](/api/classes/component.pointercomponent#accessors) |
| [Keyboard](/examples/component-keyboard) | Activate and deactivate play, navigation, and zoom [keyboard handlers](/api/classes/component.keyboardcomponent#accessors) |

### Spatial

| Example | Description |
| --- | --- |
| [Point Cloud](/examples/component-spatial) | Visualize point clouds, undistorted camera frames, and use [earth controls](/api/enums/viewer.cameracontrols) |

### Tag

| Example | Description |
| --- | --- |
| [Display](/examples/component-tag) | Display and configure [point](/api/classes/component.pointgeometry), [polygon](https://mapillary.github.io/mapillary-js/api/classes/component.polygongeometry) and [rectangle](/api/classes/component.rectgeometry) image [tags](/api/classes/component.tag) |
| [Create](/examples/component-tag-create) | Create [spot](/api/classes/component.spottag), [outline](/api/classes/component.outlinetag), and [extreme point](/api/classes/component.extremepointtag) tags from user input |
| [Interact](/examples/component-tag-interact) | Listen to tag [events](/api/classes/component.tagcomponent#events) and use the tag component [methods](/api/classes/component.tagcomponent#methods) |

### Popup

| Example | Description |
| --- | --- |
| [Display](/examples/component-popup) | Display [regular, floating](/api/classes/component.popup) and [custom, fixed](/api/interfaces/component.popupoptions) HTML popups |
| [Connect Tags](/examples/component-popup-tag) | Connect popups to [point](/api/classes/component.popup#setbasicpoint) and [rectangle](/api/classes/component.popup#setbasicrect) tags |

### Marker

| Example | Description |
| --- | --- |
| [Display](/examples/component-marker) | Display markers with different [appearance](/api/interfaces/component.simplemarkeroptions) and [behavior](/api/classes/component.markercomponent#getmarkeridat) |
| [Map Synchronization](/examples/component-marker-map) | Create and edit markers in the viewer and a [Mapbox](https://docs.mapbox.com/mapbox-gl-js/api/) map and keep them [synchronized](/api/classes/component.markercomponent#on) |
| [Million](/examples/component-marker-million) | Add one million [interactive](/api/interfaces/component.simplemarkeroptions#interactive) markers to the spatial index without affecting performance |

## Extension

| Example | MapillaryJS API | Description |
| --- | --- | --- |
| [Procedural Provider](/examples/procedural-data-provider) | Data Provider | Serve [procedurally generated](https://en.wikipedia.org/wiki/Procedural_generation) data |
| [WebGL Renderer](/examples/webgl-renderer) | Render | Use [WebGL](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API) to render a cube |
| [Three.js Renderer](/examples/three-renderer) | Render | Use [Three.js](https://threejs.org/) to render a cube |
| [Animation](/examples/animation) | Render | Make a rotating cube [animation](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Animating_objects_with_WebGL) |
| [Editor](/examples/extend-editor) | Render | Use [transform controls](https://github.com/mrdoob/three.js/blob/r125/examples/jsm/controls/TransformControls.js) to translate, rotate, and scale a box |
| [Map Synchronzation](/examples/extend-map-sync) | Render | Translate and rotate a cube in a [Mapbox](https://docs.mapbox.com/mapbox-gl-js/api/) map and reflect the changes in the viewer |
| [Fly Controls](/examples/fly-controls) | Camera Control | Attach [fly controls](https://github.com/mrdoob/three.js/blob/r127/examples/jsm/controls/FlyControls.js) leveraging Three.js |
