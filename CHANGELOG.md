# Changelog

All notable changes to MapillaryJS from v3.x will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/) and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## 4.1.0 - March 2, 2022

### :rocket: New Features

- Viewer method and event to get topocentric reference ([#475](https://github.com/mapillary/mapillary-js/pull/475))
- Add provider interfaces to APT to not require providers to extend base classes ([#477](https://github.com/mapillary/mapillary-js/pull/477))
- Flow declarations included in distribution ([#478](https://github.com/mapillary/mapillary-js/pull/478))
- Add geodetic conversion methods to exported API ([#484](https://github.com/mapillary/mapillary-js/pull/484))
- Point visualization mode enumeration ([#486](https://github.com/mapillary/mapillary-js/pull/486))
- Cluster point visualization mode ([#486](https://github.com/mapillary/mapillary-js/pull/486))
- Expose data provider as a viewer property ([#502](https://github.com/mapillary/mapillary-js/pull/502))
- Add viewer method to check if camera controls are attached ([#503](https://github.com/mapillary/mapillary-js/pull/503))

### :bug: Fixed

- Detach custom camera controls correctly ([#474](https://github.com/mapillary/mapillary-js/pull/474))
- Guard against bleeding CSS line height values ([#499](https://github.com/mapillary/mapillary-js/pull/499))
- Move spatial component items instead of disposing on reference change to avoid race conditions ([#504](https://github.com/mapillary/mapillary-js/pull/504))
- Render spatial component items correctly on activation ([#508](https://github.com/mapillary/mapillary-js/pull/508))

### :nail_care: Improvements

- Render spherical camera frames to avoid large star shapes for fisheye models ([#464](https://github.com/mapillary/mapillary-js/pull/464))
- Smooth transition when entering earth state ([#501](https://github.com/mapillary/mapillary-js/pull/501))

### :memo: Documentation

- Add custom renderer example for synchronizing content pose between viewer and map ([#452](https://github.com/mapillary/mapillary-js/pull/452))
- Fix JSDoc typos ([#458](https://github.com/mapillary/mapillary-js/pull/458))
- Add viewer control and component guides ([#465](https://github.com/mapillary/mapillary-js/pull/465))
- Improve wording in readme and try documentation, fix readme commands ([#465](https://github.com/mapillary/mapillary-js/pull/465))
- Fix WebGL and editor examples ([#467](https://github.com/mapillary/mapillary-js/pull/467))
- Add guide to write custom renderers for graphics developers ([#483](https://github.com/mapillary/mapillary-js/pull/483))
- Add relevant phrases to glossary ([#485](https://github.com/mapillary/mapillary-js/pull/485))
- Fix setup command example in contribution documention ([#496](https://github.com/mapillary/mapillary-js/pull/496))
- Clarify how custom renderers should use onRemove method ([#517](https://github.com/mapillary/mapillary-js/pull/517))

### :house: Internal

- Update dependencies ([#457](https://github.com/mapillary/mapillary-js/pull/457))
- Allow IDs of type number in cover component ([#446](https://github.com/mapillary/mapillary-js/pull/446))
- Build library and documentation in different action jobs ([#450](https://github.com/mapillary/mapillary-js/pull/450))

## 4.0.0 - June 8, 2021

### :rocket: New Features

- Add ES6 module build to distribution ([#341](https://github.com/mapillary/mapillary-js/pull/341))
- Add TypeScript type definitions to distribution ([#341](https://github.com/mapillary/mapillary-js/pull/341))
- Add custom render API for augmented experiences ([#336](https://github.com/mapillary/mapillary-js/pull/336))
- Custom camera controls API to freely move the `Viewer` camera ([#373](https://github.com/mapillary/mapillary-js/pull/373))
- Emit `load` event on initial `Viewer` load ([#376](https://github.com/mapillary/mapillary-js/pull/376))
- Add data provider event functionality (([#364](https://github.com/mapillary/mapillary-js/pull/364))
- `Viewer` option to deactivate image tiling ([#352](https://github.com/mapillary/mapillary-js/pull/352))

### :boom: Breaking

- Track resize internally by default ([#353](https://github.com/mapillary/mapillary-js/pull/353))
- Rename JavaScript and CSS distribution files ([#341](https://github.com/mapillary/mapillary-js/pull/341))
- Change global UMD name ([#355](https://github.com/mapillary/mapillary-js/pull/355))
- Rewrite data provider API ([#345](https://github.com/mapillary/mapillary-js/pull/345))
- Replace default data provider ([#435](https://github.com/mapillary/mapillary-js/pull/435))
- Consolidate geometry provider API ([#357](https://github.com/mapillary/mapillary-js/pull/357))
- Consolidate public API - no namespacing ([#367](https://github.com/mapillary/mapillary-js/pull/367))
- Rename `mouse` to `pointer` component ([#414](https://github.com/mapillary/mapillary-js/pull/414))
- Rename `latLon` to `lngLat` ([#363](https://github.com/mapillary/mapillary-js/pull/363))
- Rename `node` to `image` ([#361](https://github.com/mapillary/mapillary-js/pull/361))
- Remove `route`, `background`, and `debug` components ([#344](https://github.com/mapillary/mapillary-js/pull/344))
- Remove cropped spherical camera type support ([#344](https://github.com/mapillary/mapillary-js/pull/344))
- Remove `node` panorama properties ([#344](https://github.com/mapillary/mapillary-js/pull/344))

### :bug: Fixed

- Remove event listeners correctly ([#430](https://github.com/mapillary/mapillary-js/pull/430))
- Render spatial items directly on activation ([#390](https://github.com/mapillary/mapillary-js/pull/390))
- Render spherical images with non-valid scale correctly ([#378](https://github.com/mapillary/mapillary-js/pull/378))
- Throw understandable errors in graph ([#368](https://github.com/mapillary/mapillary-js/pull/368))
- Handle mouse up not fired outside of window for right mouse button ([#342](https://github.com/mapillary/mapillary-js/pull/342))
- Handle fisheye origin singularity ([#339](https://github.com/mapillary/mapillary-js/pull/339))
- Filter spatial data ([#338](https://github.com/mapillary/mapillary-js/pull/338))
- Fix earth controls in Firefox on Mac ([#333](https://github.com/mapillary/mapillary-js/pull/333))
- Allow different image tiling configs for multiple viewers in the same app ([#441](https://github.com/mapillary/mapillary-js/pull/441))

### :nail_care: Improvements

- Request image tiles immediately on halt ([#375](https://github.com/mapillary/mapillary-js/pull/375))
- Position earth state based on initial pose ([#398](https://github.com/mapillary/mapillary-js/pull/398))
- Request image tiles for low level ([#386](https://github.com/mapillary/mapillary-js/pull/386))
- Improve spatial performance with logarithmic raycasting though octree ([#377](https://github.com/mapillary/mapillary-js/pull/377))
- Typed event handlers ([#360](https://github.com/mapillary/mapillary-js/pull/360))
- Unified component event structure ([#347](https://github.com/mapillary/mapillary-js/pull/347))
- Decrease minified library disribution size from 1.8Mb to 1.1Mb ([#341](https://github.com/mapillary/mapillary-js/pull/341))
- Right button drag to orbit in earth mode ([#334](https://github.com/mapillary/mapillary-js/pull/334))

### :memo: Documentation

- Simplity readme text, examples, and improve image ([395](https://github.com/mapillary/mapillary-js/pull/395))
- Docusaurus documentation website - guides, API reference, examples, theory, migration, search ([#396](https://github.com/mapillary/mapillary-js/pull/396))

### :house: Internal

- Build distribution with Rollup ([#341](https://github.com/mapillary/mapillary-js/pull/341))
- Unit test with Jest ([#341](https://github.com/mapillary/mapillary-js/pull/341))
- Script to setup developnent environment access tokens ([412](https://github.com/mapillary/mapillary-js/pull/412))
- Publish relevant files only ([#356](https://github.com/mapillary/mapillary-js/pull/356))
- Move configuration files to separate directly ([#354](https://github.com/mapillary/mapillary-js/pull/354))
- Prefix all style classes with mapillary ([#343](https://github.com/mapillary/mapillary-js/pull/343))

## 3.1.0 - January 20, 2021

### :rocket: New Features

- Remove method on `Viewer` for releasing resources ([#321](https://github.com/mapillary/mapillary-js/pull/321))
- Add `GeoCoords` class to API ([#322](https://github.com/mapillary/mapillary-js/pull/322))
- Add original altitude property to `Node` and `IFillNode` ([#326](https://github.com/mapillary/mapillary-js/pull/326))
- Spatial camera and point resize options ([#319](https://github.com/mapillary/mapillary-js/pull/319))
- Spatial option for orginal altitude ([#326](https://github.com/mapillary/mapillary-js/pull/326))
- Spatial mouse interaction ([#319](https://github.com/mapillary/mapillary-js/pull/319))
- Comply with filter in spatial component ([#324](https://github.com/mapillary/mapillary-js/pull/324))

### :nail_care: Improvements

- Disable play functionality in earth mode ([#320](https://github.com/mapillary/mapillary-js/pull/320))

### :memo: Documentation

- Fix examples of viewer creation ([#318](https://github.com/mapillary/mapillary-js/pull/318))
- Remove obsolete `move close to` example ([#323](https://github.com/mapillary/mapillary-js/pull/323))

### :house: Internal

- Add docker development option and instruction ([#325](https://github.com/mapillary/mapillary-js/pull/325))

## 3.0.0 - December 12, 2020

### :rocket: New Features

- Add `qualityScore` property on `Node`
- Data provider API to enable loading data from any source

### :boom: Breaking

- Change `Viewer` constructor to take only an options struct as parameter
- Remove `Viewer` class `moveCloseTo` method
- Rename `Viewer` class `setAuthToken` method to `setUserToken`
- Rename `Node` class `cameraProjection` property to `cameraProjectionType`
- Remove `StatsComponent`
- Remove `LoadingComponent`
- Move `IUrlOptions` properties to `IFalcorDataProviderOptions`

### :memo: Documentation

- Add data provider info to documentation
- Restructure readme information
- Add GitHub specific content
- Add changelog

### :house: Internal

- Rename `Container` class `element` property to `container`
- Use GitHub actions for continuous integration
- Use Yarn for development
