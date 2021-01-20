# Changelog

All notable changes to this project from MapillaryJS 3.x will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/) and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## 3.1.0 - January 20, 2021

### :rocket: New features
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

### :rocket: New features
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
