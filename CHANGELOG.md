# Changelog

All notable changes to this project from MapillaryJS 3.x will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/) and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## 3.0.0 - 2020-12-10

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
