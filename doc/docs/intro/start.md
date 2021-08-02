---
id: start
title: Introduction
slug: /
---

**MapillaryJS** is a client-side JavaScript library for building street imagery map experiences. You can use MapillaryJS to display street imagery maps in a web browser or client and you can augment the experience with your own data.

This page is an overview of the MapillaryJS `v4.x` documentation and related resources.

### Use cases

Use cases for MapillaryJS include:

- Navigating real world places in an interactive street imagery experience
- Visualizing, editing, and animating 3D representations of geographic data
- Dynamically displaying custom client-side data in an undistorted virtual 3D world
- Adding markers and popups to street imagery maps programmatically

### Try MapillaryJS

Our [guide to trying MapillaryJS](/docs/intro/try) will take you through the installation and give a first experience of using MapillaryJS by adding it to a simple HTML page.

:::note

Throughout the documentation you will see live examples. The live example editors use the [React library](https://reactjs.org/) and the [JSX syntax](https://reactjs.org/docs/introducing-jsx.html). If you have not used React before, that is no problem, understanding React and JSX is not needed to follow along in the guides.

:::

### Step-by-Step Guide

Our [guide to main concepts](/docs/main/guide) is the best place to start to learn concepts step by step. Every next chapter in it builds on the knowledge introduced in the previous chapters.

### Extend and Augment

Once you’re comfortable with the main concepts and have played with MapillaryJS a little bit, you might be interested in more advanced topics. The [guide to extending MapillaryJS](/docs/extension/extend) will introduce you to the powerful extension APIs which lets you extend and augment the MapillaryJS experience. You can load and visualize your own data format, render your own 3D models onto the MapillaryJS canvas, and define your own interactivity.

### API Reference

The [API reference](/api) is useful when you want to learn more details about a particular MapillaryJS API.

### Examples

The [examples section](/examples) gives you a deep dive into the details of using the MapillaryJS APIs through code examples.

## Essentials

### What is MapillaryJS, Exactly?

MapillaryJS is an interactive, extendable street imagery map component for semantic map visualization on the web. But what does that actually mean? Let us go through it together.

As a start, you can think of MapillaryJS as a three-dimensional sibling to a traditional 2D map. While the traditional 2D map gives a great overview, the street imagery map gives you access to the finest details. MapillaryJS can be a used as a component in any web application, paired with a 2D map or on its own.

#### Interactive

MapillaryJS provides user interactivity to navigate the street imagery smoothly in a virtual, undistorted 3D world.

#### Street Imagery

Street imagery is simply images captured anywhere on earth at street-level, i.e roughly at eye-height. MapillaryJS provides interactivity to navigate street imagery smoothly in a virtual, undistorted 3D world.

#### Semantic Map

[Mapping](https://en.wikipedia.org/wiki/Cartography) is the practice of making or using maps.

[Semantics](https://en.wikipedia.org/wiki/Semantics) is the study of meaning, reference or truth. In our case, it is about understanding the meaning of each part of the map.

MapillaryJS provides methods to visualize the underlying data used to create semantic 3D maps through its spatial rendering capabilities. This is useful for understanding the structure of semantic mapping algorithm output.

#### Extendable Visualization Component

MapillaryJS aims to provide the following characteristics:

- Core capabilities
  - A small set of capabilities that work really well.
    - Interactivity - Smooth street level and map camera navigation, panning, zooming.
    - Navigation graph construction - S2 cell based graph creation.
    - Image tiling - On demand, full resolution image rendering.
    - Undistortion - Textures and camera frames should be undistorted in the virtual 3D world.
    - Spatial rendering - Point clouds, camera frames, GPS positions.
- Stability
  - The functionality provided by the platform should be deterministic.
  - Unit test coverage should be high to avoid regressions.
- Great performance
  - All the core capabilities should provide outstanding performance.
- Easy to understand APIs
  - While the MapillaryJS APIs should provide great power to the developers building upon MapillaryJS, they should also be coherent and simple to use.
- Extendability
  - The core capabilities of MapillaryJS should function really well, but many applications require specific functionality and customization. Therefore MapillaryJS needs to provide powerful extension APIs for developers to build upon.
    - Load any data format.
    - Render any 3D content, e.g. by using Three.js.
    - Build application specific interactivity.

With the above, you are able to create augmented experiences by extending the MapillaryJS core functionality.

### Glossary

The [glossary](/docs/intro/glossary) contains an overview of the most common terms you’ll see in the MapillaryJS documentation.

## Staying Informed

You can find a changelog for every release in the MapillaryJS repository [CHANGELOG](https://github.com/mapillary/mapillary-js/blob/main/CHANGELOG.md), as well as on the [Releases](https://github.com/mapillary/mapillary-js/releases) page.

## Something Missing?

If something is missing in the documentation or if you found some part confusing, please [send a pull request](https://github.com/mapillary/mapillary-js/blob/main/.github/CONTRIBUTING.md#sending-a-pull-request) or [file an issue](https://github.com/mapillary/mapillary-js/issues/new) for the source code repository with your suggestions for improvement.
