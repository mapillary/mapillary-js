---
id: polygon-triangulation
title: Polygon Triangulation on the Sphere
---

In MapillaryJS, we render manually created and segmented polygons and fill them with colors with the help of [polygon triangulation](https://en.wikipedia.org/wiki/Polygon_triangulation).

Note that at Mapillary, we often talk about triangulation related to positioning map features on the map. But polygon triangulation is a different thing. It's a technique in computational geometry that helps create simplified 3D models ([meshes](https://en.wikipedia.org/wiki/Polygon_mesh)) of objects and is often used in geometric modeling and computer graphics. And at Mapillary, as mentioned, we use it to help visualize semantic segmentation in the 3D representation of the world that you see through the Mapillary viewer.

While it's fairly easy to create meshes of shapes on a plane in two dimensions, such as in regular images, it's considerably more complex for spheres—which we use to render panoramic images. And that is a challenge we at Mapillary need to tackle, as there is a considerable amount of 360° imagery on the Mapillary platform. So let's take a look at how we've worked out a solution.

## A Practical Approach

### Start with the Vocabulary

Before explaining the challenging aspects of triangulation on the sphere, the topic for this post, let's first define a vocabulary:

- **Real 3D world**—the space that we live in and capture with cameras when mapping.
- **Distorted 2D projection**—the projection of the captured images. This is a two-dimensional space, the flat image. Projection types for images uploaded to Mapillary are generally [perspective](https://en.wikipedia.org/wiki/3D_projection#Perspective_projection), [fisheye](https://wiki.panotools.org/Fisheye_Projection), or [equirectangular](https://en.wikipedia.org/wiki/Equirectangular_projection). All projection types have some distortion. For perspective and fisheye images it's radial. For equirectangular images the distortion comes from the representation itself. In this blog post we focus on the equirectangular projection.
- **Undistorted 3D space**—the rendered space (in MapillaryJS) where textures are undistorted according to some calibration parameters. This space is three-dimensional and its aim is to represent the real 3D world as accurately as possible. In this space, equirectangular (panoramic) images are rendered as spheres.

![Equirectangular panorama - distorted 2D projection](/img/theory/polygon-equirectangular-panorama.jpg)

_Equirectangular panorama as a distorted 2D projection: straight lines of the real 3D world appear bent_

![Equirectangular panorama - undistorted](/img/theory/polygon-undistorted.jpg)

_Equirectangular panorama rendered as a sphere in undistorted 3D space: straight lines of the real 3D world appear straight_

### The Problem

The image segment visualizations in MapillaryJS are filled with different colors based on the segmentation class. The fill originates from a colored 3D mesh that is placed in front of the image, or inside the image sphere in the case of a panorama, in the undistorted 3D space in the MapillaryJS viewer.

![Polygon in front of image](/img/theory/polygon-in-front-of-image.png)

_The segmentation fill (red sphere) is placed inside the image (gray sphere) around of the camera (blue sphere). When looking out from the camera position, the segmentation fill can be rendered with transparency in front of the image._

The image segment is defined by a [polygon](https://en.wikipedia.org/wiki/Polygon) on the distorted 2D projection. This polygon needs to be [triangulated](https://en.wikipedia.org/wiki/Polygon_triangulation), i.e. divided into a set of triangles, to create the mesh mentioned above.

While it's fairly straightforward to create this mesh through triangulation for regular images, it's more complicated for equirectangular 360° panoramas because of their spherical nature. The relations between the polygon vertices (the corners of polygons) change when undistorting from the equirectangular projection.

These relational changes can lead to faulty triangles if the triangulation is performed on the original distorted 2D projection. Triangles can, for example, appear outside the actual polygon outline when unprojected from the distorted 2D projection to the undistorted 3D space. So the polygons can't be triangulated directly on the distorted 2D projection. Also, the triangulation needs to be performed in 2D. Therefore, it can't be done directly in 3D on the image sphere, so we need another method.

Besides solving the actual triangulation, we also need a method that is performant because we may need to triangulate hundreds of polygons with thousands of vertices for a single image. We need to perform the triangulation while keeping the MapillaryJS viewer as responsive as possible.

An example of what we want to achieve can be seen in the figures below. A simple [hexgonal](https://en.wikipedia.org/wiki/Hexagon) polygon has been segmented on an equirectangular 360° panorama. We want to be able to render it filled with a color in the undistorted 3D space.

![Polygon on image](/img/theory/polygon-on-real-image.png)

_A simple hexagonal polygon detected on the distorted 2D projection of an equirectangular panorama_

![Polygon in front of image](/img/theory/polygon-on-undistorted-image.png)

_The polygon rendered in the undistorted 3D space on the sphere—the hexagon shape has been altered (only a small part of the image is rendered in this viewport)_

### The Solution

The relative postions of the polygon vertices that we want to triangulate are those on the sphere. While we can't triangulate directly on the spherical 3D coordinates, we can [perspectively project](https://en.wikipedia.org/wiki/3D_projection#Perspective_projection) these 3D coordinates to a [2D plane](<https://en.wikipedia.org/wiki/Plane_(geometry)>). Then we can triangulate in 2D.

It is not possible to project all the points on the sphere to a single plane, some points will end up behind the plane.

![Polygon behind camera](/img/theory/polygon-behind-camera.png)

_Perspectively projecting points to a plane: the red sphere can be projected because it is in front of the plane while the grey sphere cannot because it is behind the blue camera position with respect to the plane_

Therefore, we have to divide the distorted 2D projecton into a number of subareas that are small enough so that all points will end up in front of a chosen plane. Let us divide the image into a grid that ensures that no subarea covers more than 180 degrees. If we choose a grid of 2 x 3 rectangular subareas, no subarea covers more that 120 degrees on the sphere. After dividing the image, we can divide the triangulation problem into six subproblems by clipping the polygon in each subarea. In our case, we get three clipped polygon parts related to the subareas containing the polygon.

![Polygon on grid](/img/theory/polygon-on-grid.png)

_The simple hexagonal polygon on top of a grid defining 6 subareas_

![Polygon clipped to grid items](/img/theory/polygon-clipped.png)

_The polygon clipped to each subarea_

After clipping the polygon, we can unproject it to the sphere and then immediately project it to a plane with the [normal](<https://en.wikipedia.org/wiki/Normal_(geometry)>) in the direction of the center of the grid rectangle to ensure that all points are in front of the plane.

![Polygon clipped and unprojected on sphere](/img/theory/polygon-clipped-on-sphere.png)

_Clipped polygon part unprojected to sphere_

![Polygon clipped and projected](/img/theory/polygon-clipped-projected.png)

_Clipped polygon part projected to a plane from the center of the sphere_

Once projected, we can now triangulate the clipped polygon and then fill the triangles with color.

![Polygon triangulated](/img/theory/polygon-triangulated.png)

_Triangulated clipped polygon part_

If we now assemble all the triangles from the different subareas, we have our completed triangulation. We can render the polygon with fill in undistorted 3D space.

![Polygon combined on sphere](/img/theory/polygon-combined-sphere.png)

_Assembled polygon parts form the complete polygon, here rendered in undistorted 3D space on the sphere_

Below is a simplified pseudo-algorithm for triangulating a polygon on the sphere:

1. Divide the original image into x times y rectangular subareas where x >= 3 and y >= 2 to ensure that a subarea covers at most an angle of 120 degrees on the sphere.
2. Create an empty 3D coordinate triangles array.
3. For each subarea:
   1. Clip the polygon according to the subarea boundaries using the distorted 2D coordinates.
   2. Unproject the distorted 2D coordinates of the polygon to undistorted 3D coordinates.
   3. Project the the undistorted 3D coordinates to a plane in front of a camera with principal ray going through the center of the subarea.
   4. Triangulate the projected 2D coordinates.
   5. Add the undistorted 3D coordinates corresponding to the triangle indices to the triangles array.
4. Use the assembled 3D coordinate triangle array.

The end result can be seen below.

![Rendered polygons](/img/theory/polygon-rendered.jpg)

_Rendering segmentation polygons with fill in an equirectangular 360° panorama_

### Summary

With our practical and performant approach to triangulate polygons defined on the sphere, we can visualize segmentations detected on equirectangular panoramas in a better way by rendering polygons on the sphere with fill. We do it by dividing the spherical triangulation problem into smaller subproblems that are simpler to solve. Then we combine the results from each subproblem into the final solution.
