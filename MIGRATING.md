# Migrating

This document describes how to migrate between major versions of MapillaryJS.

# MapillaryJS 2 to 3

## Components

The `stats` and `loading` components have been removed. Configuring these components in the component options struct will no longer have any effect.

## Node class

The following property names have changed.

|MapillaryJS 2|MapillaryJS 3|
|---|---|
|`cameraProjection`|`cameraProjectionType`|

## Viewer class

### Constructor parameters

All parameters of the viewer constructor now goes into the viewer options object.

MapillaryJS 3:
```js
var mly = new Mapillary.Viewer({
    apiClient: '<your client id>',
    container: '<your container id>',
    imageKey: '<your optional image key for initializing the viewer>',
    userToken: '<your optional auth token>',
    // your other viewer options
});
```

MapillaryJS 2:
```js
var mly = new Mapillary.Viewer(
    '<your container id>',
    '<your client id>',
    '<your optional image key for initializing the viewer>',
    {
        // your other viewer options
    },
    '<your optional auth token>',
);
```

### Move close to

The `Mapillary.Viewer.moveCloseTo` method has been removed, use the [Mapillary REST API](https://www.mapillary.com/developer/api-documentation/#search-images) for this functionality instead.

### Auth token

The name of the method for setting a user auth token has changed.

MapillaryJS 3:
```ts
viewer.setUserToken('<your user token>');
```

MapillaryJS 3:
```ts
viewer.setAuthToken('<your user token>');
```

### URL options

Most URL options now need to be set through the Falcor data provider. When setting the Falcor data provider explicitly, the client and user tokens also need to be set on the provider.

MapillaryJS 3:
```js
var provider = new Mapillary.API.FalcorDataProvider({
    apiHost: '<your api host>',
    clientToken: '<your client id>',
    clusterReconstructionHost: '<your cluster reconstruction host>',
    imageHost: '<your image host>',
    imageTileHost: '<your image tile host>',
    meshHost: '<your mesh host>',
    scheme: '<your scheme for all falcor data provider hosts>',
    userToken: '<your optional auth token>',
});

var mly = new Mapillary.Viewer({
    apiClient: provider,
    container: '<your container id>',
    imageKey: '<your optional image key for initializing the viewer>',
    url: {
        exploreHost: '<your explore host>',
        scheme: '<your explore scheme>',
    },
});
```

MapillaryJS 2:
```js
var mly = new Mapillary.Viewer(
    '<your container id>',
    '<your client id>',
    '<your image key>',
    {
        url: {
            apiHost: '<your api host>',
            clusterReconstructionHost: '<your cluster reconstruction host>',
            exploreHost: '<your explore host>',
            imageHost: '<your image host>',
            imageTileHost: '<your image tile host>',
            meshHost: '<your mesh host>',
            scheme: '<your scheme for all hosts>',
        }
    },
    '<your optional auth token>',
);
```


# MapillaryJS 1 to 2

MapillaryJS 2 has a completely rewritten graph structure and IO handling. The graph was rewritten to, among other things, load nodes faster when using the `viewer.move*` methods.

The requirements on the new graph meant breaking changes to the MapillaryJS API. In addition to the graph related changes some other breaking changes have been introduced as well.

## Edge handling

### MapillaryJS 1

In MapillaryJS 1 the `edges` were always cached for `nodes` retrieved from the `nodechanged` event. The properties related to `edge` handling for the `node` where the following:

```ts
edges: IEdge[]
edgesCached: boolean
```
Here, the edges array was always guaranteed to be populated when retrieved from the node of the `nodechanged` event. The edges array could be traversed immediately.

### MapillaryJS 2

In MapillaryJS 2, the graph creation is changed in a way that does not guarantee that the edges have been determined for the current node when it is retrieved from the `nodechanged` event. The edges have also been separated into two different entities, `sequence` and `spatial` edges. The different entities will be retrieved asyncronously and may be set at different times. Therefor, in MapillaryJS 2.0, the node properties related to edges are the following:

```ts
sequenceEdges: IEdgeStatus
sequenceEdges$: Observable<IEdgeStatus>

spatialEdges: IEdgeStatus
spatialEdges$: Observable<IEdgeStatus>
```

The edge status is like so:

```ts
interface IEdgeStatus {
    cached: boolean;
    edges: IEdge[];
}
```

To simplify working with the edges the `sequenceedgeschanged` and `spatialedgeschanged` events on the `Viewer` should be used.

In the same way as before, the viewer will emit a `nodechanged` event every time the current node changes. Immediately after the `nodechanged` event it will emit the `sequenceedgeschanged` and `spatialedgeschanged` events containing the current edge statuses. At this point the edges may or may not be cached. If the sequence or spatial edges for the current node are cached or changed at a later point in time the `sequenceedgeschanged` and `spatialedgeschanged` events will fire respectively.

The `sequenceedgeschanged` and `spatialedgeschanged` events always emit edge status objects related to the current node retrieved from the `nodechanged` event, never for any other nodes.

Subscribing to the `sequenceedgeschanged` and `spatialedgeschanged` events is done in the following way:

```js
viewer.on(Mapillary.Viewer.sequenceedgeschanged, function(status) { <do something>; });
viewer.on(Mapillary.Viewer.spatialedgeschanged, function(status) { <do something>; });
```


## Node properties

Apart from the edge handling described above the status of the new node class is the following:

### Identical properties

|MapillaryJS 1 & 2|
|---|
|`ca`|
|`capturedAt`|
|`fullPano`|
|`image`|
|`key`|
|`latLon`|
|`loadStatus`|
|`merged`|
|`mesh`|
|`pano`|

### Changed properties

|MapillaryJS 1|MapillaryJS 2|
|---|---|
|`apiNavImIm.atomic_scale`|`scale`|
|`apiNavImIm.ca`|`originalCA`|
|`apiNavImIm.calt`|`alt`|
|`apiNavImIm.camera_mode`|`scale`|
|`apiNavImIm.captured_at`|`capturedAt`|
|`apiNavImIm.cca`|`computedCA`|
|`apiNavImIm.cfocal`|`focal`|
|`apiNavImIm.clat`|`computedLatLon.lat`|
|`apiNavImIm.clon`|`computedLatLon.lon`|
|`apiNavImIm.gpano`|`gpano`|
|`apiNavImIm.height`|`height`|
|`apiNavImIm.key`|`key`|
|`apiNavImIm.lat`|`originalLatLon.lat`|
|`apiNavImIm.lon`|`originalLatLon.lon`|
|`apiNavImIm.merge_cc`|`mergeCC`|
|`apiNavImIm.merge_version`|`mergeVersion`|
|`apiNavImIm.orientation`|`orientation`|
|`apiNavImIm.rotation`|`rotation`|
|`apiNavImIm.user`|`username`|
|`apiNavImIm.width`|`width`|
|`sequence.key`|`sequenceKey`|


### Removed properties

|MapillaryJS 1|
|---|
|`apiNavImIm`|
|`apiNavImIm.camera_mode`|
|`apiNavImIm.fmm35`|
|`hs`|
|`sequence`|
|`worthy`|

### New properties

|MapillaryJS 2|
|---|
|`assetsCached`|
|`userKey`|

## Navigator failure cases

When the `Viewer.moveDir` and `Viewer.moveCloseTo` methods are called there may not be a valid result. In that case, both methods throw errors that need to be handled by the caller.

Whenever any of the `Viewer.moveToKey`, `Viewer.moveDir` or `Viewer.moveCloseTo` methods encounter an IO related problem the error will propagate to the caller.

## Rotation edge direction

The `EdgeDirection.RotateLeft` and `EdgeDirection.RotateRight` enumeration values have been removed.

## Component initialization

The component options have been broken out from the regular viewer options.

MapillaryJS 1:
```js
var mly = new Mapillary.Viewer(
    'mly',
    '<your client id>',
    '<your image key for initializing the viewer>',
    {
        baseImageSize: Mapillary.ImageSize.Size320,
        cache: true,
        keyboard: false,
        sequence: {
            maxWidth: 150,
            minWidth: 80,
        },
        renderMode: Mapillary.RenderMode.Fill,
    }
);
```

MapillaryJS 2:
```js
var mly = new Mapillary.Viewer(
    'mly',
    '<your client id>',
    '<your image key for initializing the viewer>',
    {
        baseImageSize: Mapillary.ImageSize.Size320,
        component: {
            cache: true,
            keyboard: false,
            sequence: {
                maxWidth: 150,
                minWidth: 80,
            },
        },
        renderMode: Mapillary.RenderMode.Fill,
    }
);
```

## Image plane component

The image plane component has been renamed:

|MapillaryJS 1|MapillaryJS 2|
|---|---|
|`imageplane`|`imagePlane`|

This affects component initialization and the component API on the viewer.

## Render mode

`RenderMode.Fill` is now the default render mode (instead of `RenderMode.Letterbox`) when creating a new viewer instance.

## Auth removed

The deprecated `Viewer.Auth` method has been removed.

## Renamed distribution files

The distribution files have been renamed according to the following:

|MapillaryJS 1|MapillaryJS 2|
|---|---|
|`mapillary-js.js`|`mapillary.js`|
|`mapillary-js.min.js`|`mapillary.min.js`|
|`mapillary-js.min.css`|`mapillary.min.css`|
