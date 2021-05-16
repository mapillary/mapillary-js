---
id: coordinates
title: Coordinate Systems
---

## 3D Coordinates

Throughout MapillaryJS, two 3-dimensional coordinate systems are used; [Geodetic (WGS84)](https://en.wikipedia.org/wiki/Geodetic_datum) and [Local Topocentric East, North, Up (ENU)](https://en.wikipedia.org/wiki/Local_tangent_plane_coordinates).

When interacting with the MapillaryJS API you will generally use Geodetic coordinates. In some situations such as when writing custom renderers, you will most probably work with both and convert between them.

:::note

MapillaryJS provides helper functions for [geographic coordinates conversion](https://en.wikipedia.org/wiki/Geographic_coordinate_conversion) through the [enuToGeodetic](/api/modules/api#enutogeodetic) and [geodeticToEnu](/api/modules/api#geodetictoenu) functions.

:::

### Geodetic Coordinates

The WGS84 datum has longitude (degrees), latitude (degrees) and altitude (meters) values.

### Local Topocentric Coordinates

In the _ENU_ (or _World_) reference frame the x-axis points to East, the y-axis to North and the z-axis up. All values are represented in meters.

### Conversion

Coordinates can be converted between the _geodetic_ and _local topocentric_ coordinates like so.

| Geodetic  | ENU   | Topocentric | Direction |
| --------- | ----- | ----------- | --------- |
| Longitude | East  | X           | Right     |
| Latitude  | North | Y           | Forward   |
| Altitude  | Up    | Z           | Up        |

### Local Camera Coordinates

When writing data provider extensions, you will also need to handle [Local camera coordinates](https://www.opensfm.org/docs/cam_coord_system.html).

## 2D Coordinates

MapillaryJS also works with a number of different 2D coordinate systems.

### Container Pixel Coordinates

Pixel coordinates are coordinates on the viewer container. The origin is in the top left corner of the container. The axes are directed according to the following for a viewer container with a width of 640 pixels and height of 480 pixels.

```
(0,0)                          (640, 0)
     +------------------------>
     |
     |
     |
     v                        +
(0, 480)                       (640, 480)
```

### Basic Image Coordinates

Basic image coordinates represents points in the original image adjusted for orientation. They range from 0 to 1 on both axes. The origin is in the top left corner of the image and the axes are directed according to the following for all image types.

```
(0,0)                          (1, 0)
     +------------------------>
     |
     |
     |
     v                        +
(0, 1)                         (1, 1)
```

For every camera viewing direction it is possible to convert between these two coordinate systems for the current image. The image can be panned and zoomed independently of the size of the viewer container resulting in different conversion results for different viewing directions

## Additional Information

:::info

See the [OpenSfM coordinate system documentation](https://www.opensfm.org/docs/geometry.html#coordinate-systems) for additional information about _Normalized image coordinates_ (or _OpenSfM coordinates_), _Upright image coordinates_ (or _Basic cordinates_), _World coordinates_, and _Local camera coordinates_.

:::
