---
id: glossary
title: Glossary
---

This glossary provides a non-exhaustive list of terms used in the MapillaryJS documentation and codebase.

## Camera Calibration

[Camera calibration](https://en.wikipedia.org/wiki/Camera_resectioning) is the process of [estimating the parameters](https://www.mathworks.com/help/vision/ug/camera-calibration.html) of a camera model to approximate the physical (or virtual) camera that captured a set images.

## Camera Capture

[Still image](https://en.wikipedia.org/wiki/Image#Still_or_moving) captured by a [camera](https://en.wikipedia.org/wiki/Camera). It can be photographs but also frames extracted from a video. The still images are used as background textures in the [street imagery map](#street-imagery-map).

## Camera Controls

Specifies different modes for how the [viewer](#viewer)'s virtual camera is controlled through pointer, keyboard or other modes of input. Custom camera controls allow the API user to freely move the viewer's camera and define the [camera projection] used.

## Camera Frame

A three-dimensional visual representation of a the camera used to capture a still image. Different projection types and camera parameters can be visualized in different ways to indicate the underlying camera model and parameters.

## Custom Renderer

Can be implemented to superimpose any geo-anchored 3D content on the street-level imagery. You can render 3D models of any format and create animations in the undistorted 3D space of MapillaryJS. You can even create 3D content editor functionality directly in the viewer.

## Data Provider

Write a data provider to render your own 3D reconstruction data of any format in MapillaryJS. You can use the data provider API to provide data in the MapillaryJS ent format. The data can come from anywhere, e.g. service APIs, JSON files, or even be generated procedurally in the browser.

## Distortion

[Distortion](<https://en.wikipedia.org/wiki/Distortion_(optics)>) is a deviation from [rectilinear projection](https://en.wikipedia.org/wiki/Rectilinear_lens); a projection in which straight lines in a scene remain straight in an image.

### Distort

When a scene of the [real 3D world](#real-3d-world) is captured with cameras, it is projected onto 2D textures. Depending on the camera, this process can introduce some errors. One of them is radial distortion, which causes straight lines in the real world to look bent in the 2D image.

### Undistort

Using [computer vision](https://en.wikipedia.org/wiki/Computer_vision), it is possible to [compensate for radial distortion](https://docs.opencv.org/3.4/dc/dbb/tutorial_py_calibration.html).

Radial distortion is different for every camera. To reconstruct a good 3D model from 2D images we need to determine the distortion. Mapillary uses [OpenSfM](https://github.com/mapillary/opensfm) as the technology for 3D reconstruction, which calculates radial distortion parameters during the process. Using the calibration parameters, image textures can be undistorted on the fly in MapillaryJS. The result is that lines that are straight in the real world will now also be straightened in MapillaryJS. Another effect is that image borders are not straight anymore after undistorting the image.

Besides making images look more realistic, undistortion also has several other benefits. In general, image pixels are now correctly related to 3D positions in the viewer. This results in better alignment between the pixels of different images and, therefore, smoother transitions and less artifacts when navigating between images.

## Geographic Anchor

A geographic anchor identifies a geographic location and an orientation using latitude, longitude, altitude, and rotation data. 3D models or AR effects can be geo-anchored in the undistorted 3D space in MapillaryJS.

## Image

The [Image](/api/classes/viewer.Image) is the main MapillaryJS entity. An image consists of the texture of a [camera capture](#camera-capture), metadata associated with that camera capture, and artifacts derived from the camera capture itself or the group of adjacent camera captures.

## Image Tile

2D world maps are divided into tile sets with different level of detail. When zooming to a specific city of the map, higher resolution tiles are loaded and more details appear. In the same way, an image with high resolution can be tiled into smaller pieces. With image tiling it is possible to view every pixel and detail of the original photo without having to load every part of the image at once.

## Street Imagery Map

A three-dimensional map where the primary navigation and point of view are from the street perspective. The map is visualized through textures and geo-spatial data. MapillaryJS is an example of a street imagery map.

## Projection

When talking about projection, we usually refer to the case of an approximated [ideal pinhole camera](https://en.wikipedia.org/wiki/Pinhole_camera_model). The camera projects coordinates of a point in three-dimensional space onto its image plane. This mapping can be described by the [camera matrix](https://en.wikipedia.org/wiki/Camera_matrix).

### Types

Many different [projection models](https://en.wikipedia.org/wiki/3D_projection) exist. The once most commonly used with MapillaryJS are [perspective](https://en.wikipedia.org/wiki/3D_projection#Perspective_projection), [fisheye](https://en.wikipedia.org/wiki/Fisheye_lens), and [spherical](https://en.wikipedia.org/wiki/Equirectangular_projection) (or equirectangular) projections.

## Unprojection

Unprojection is the inverse of [projection](#projection). It is a mapping from points on the two-dimensional image plane to the three-dimensional scene.

## Viewer

The [Viewer](/api/classes/viewer.Viewer) object represents the visible, navigable, and interactive imagery component. When you integrate the MapillaryJS street imagery map into your application, you always instantiate a new viewer with a set of options. You use the viewer API to affect the viewer programmatically.

## Space

### Real 3D World

The space that we live in. A scene of the real 3D space is captured with cameras when mapping.

### Distorted 2D Projection

The [projection](#projection) of the [camera captures](#camera-capture). This is a two-dimensional space, the flat texture. Projection types for images uploaded to Mapillary are generally perspective, fisheye, or equirectangular. All projection types have some distortion. For [perspective](#perspective) and [fisheye](#fisheye) images it's radial. For [equirectangular](#equirectangular) images the distortion comes from the representation itself.

### Undistorted 3D Space

The rendered space in MapillaryJS where textures are undistorted according to their calibration parameters. This space is three-dimensional and its aim is to represent the real 3D world as accurately as possible. In this space, equirectangular (panoramic) images are rendered as spheres.
