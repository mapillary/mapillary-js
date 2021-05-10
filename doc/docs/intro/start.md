---
id: start
title: Getting Started
slug: /
---

## Overview

This page is an overview of the MapillaryJS documentation and related resources.

### Try MapillaryJS

Our [guide to trying MapillaryJS](intro/try) will take you through the installation and give you a taste of MapillaryJS by adding it to a simple HTML page.

### Step-by-Step Guide

Our [guide to main concepts](/docs/guides) is the best place to start to learn concepts step by step. Every next chapter in it builds on the knowledge introduced in the previous chapters.

### Extend and Augment

Once you’re comfortable with the main concepts and played with MapillaryJS a little bit, you might be interested in more advanced topics. The [guide to extending MapillaryJS](/docs/extend) will introduce you to the powerful extension APIs which lets you extend and augment the MapillaryJS experience. You can load and visualize your own data format, render your own 3D models onto the MapillaryJS canvas, and define your own interactivity.

### API Reference

This documentation section is useful when you want to learn more details about a particular MapillaryJS API. For example, the [Viewer class API reference](/api/modules/viewer) can provide you with details on how to filter the navigation edges, listen to mouse events, etc.

### Examples

This [examples section](/examples) gives you a deep dive into the details of using the MapillaryJS APIs through live code examples.

## Essentials

### What is MapillaryJS, Exactly?

MapillaryJS is an interactive, extendable street imagery and sematic mapping visualization platform. But what does that actually mean? Let us go through it together.

#### Street Imagery

#### Semantic Mapping

#### Visualization Platform

The aim of MapillaryJS is to provide the following characteristics:

- Small set of core capabilities
  - Interactivity - Smooth street level and map camera navigation, panning, zooming
  - Navigation graph construction - S2 cell based graph creation
  - Image tiling - On demand, full resolution image rendering
  - Undistortion - Textures and camera frames should be undistorted in the virtual 3D world
  - Spatial rendering - Point clouds, camera frames, GPS positions
- Stability
  - Unit test coverage
- Great performance
  - All the core capabilities should provide outstanding performance
- Easy to understand APIs
  - While the MapillaryJS APIs should provide great power to the developers building upon MapillaryJS, they should also be coherent and simple to use
- Extendability
  - The core capabilities of MapillaryJS should function really well, but many applications require specific functionality and customization. Therefore MapillaryJS needs to provide powerful extension APIs for developers to build upon.
  - Load any data format
  - Render any 3D content, e.g. by using Three.js
  - Customize and build application specific interactivity

By providing the above characteristics, MapillaryJS can be a visualization platform in the browser for spatial and mapping developers to build upon and extend.

### Glossary

The [glossary](intro/glossary) contains an overview of the most common terms you’ll see in the MapillaryJS documentation.

## Staying Informed

You can find a changelog for every release in the [CHANGELOG.md](https://github.com/mapillary/mapillary-js/blob/main/CHANGELOG.md) file in the MapillaryJS repository, as well as on the [Releases](https://github.com/mapillary/mapillary-js/releases) page.

## Something Missing?

If something is missing in the documentation or if you found some part confusing, please [send a pull request](https://github.com/mapillary/mapillary-js/blob/main/.github/CONTRIBUTING.md#sending-a-pull-request) or [file an issue](https://github.com/mapillary/mapillary-js/issues/new) for the source code repository with your suggestions for improvement.
