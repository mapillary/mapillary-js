/**
 * MapillaryJS is a JavaScript and WebGL library for exploring
 * street level imagery.
 * @name Mapillary
 */

// Bootstrap
import { AttributionComponent } from "./component/AttributionComponent";
import { BackgroundComponent } from "./component/BackgroundComponent";
import { BearingComponent } from "./component/BearingComponent";
import { CacheComponent } from "./component/CacheComponent";
import { ComponentService } from "./component/ComponentService";
import { CoverComponent } from "./component/CoverComponent";
import { DebugComponent } from "./component/DebugComponent";
import { DirectionComponent } from "./component/direction/DirectionComponent";
import { ImageComponent } from "./component/ImageComponent";
import { ImagePlaneComponent } from "./component/imageplane/ImagePlaneComponent";
import { KeyboardComponent } from "./component/keyboard/KeyboardComponent";
import { MarkerComponent as ExportMarkerComponent } from "./component/marker/MarkerComponent";
import { MouseComponent } from "./component/mouse/MouseComponent";
import { NavigationComponent } from "./component/NavigationComponent";
import { PopupComponent as ExportPopupComponent } from "./component/popup/PopupComponent";
import { RouteComponent } from "./component/RouteComponent";
import { SequenceComponent } from "./component/sequence/SequenceComponent";
import { SliderComponent } from "./component/slider/SliderComponent";
import { SpatialDataComponent as ExportSpatialDataComponent } from "./component/spatialdata/SpatialDataComponent";
import { TagComponent as ExportTagComponent } from "./component/tag/TagComponent";
import { ZoomComponent } from "./component/zoom/ZoomComponent";

ComponentService.registerCover(CoverComponent);
ComponentService.register(AttributionComponent);
ComponentService.register(BackgroundComponent);
ComponentService.register(BearingComponent);
ComponentService.register(CacheComponent);
ComponentService.register(DebugComponent);
ComponentService.register(DirectionComponent);
ComponentService.register(ExportMarkerComponent);
ComponentService.register(ExportPopupComponent);
ComponentService.register(ExportSpatialDataComponent);
ComponentService.register(ExportTagComponent);
ComponentService.register(ImageComponent);
ComponentService.register(ImagePlaneComponent);
ComponentService.register(KeyboardComponent);
ComponentService.register(MouseComponent);
ComponentService.register(NavigationComponent);
ComponentService.register(SequenceComponent);
ComponentService.register(SliderComponent);
ComponentService.register(RouteComponent);
ComponentService.register(ZoomComponent);

// Mapillary module
export { isFallbackSupported, isSupported } from "./utils/Support";
export { SliderMode } from "./component/interfaces/ISliderConfiguration";
export { ComponentSize } from "./component/utils/ComponentSize";
export { AbortMapillaryError } from "./error/AbortMapillaryError";
export { MapillaryError } from "./error/MapillaryError";
export { EdgeDirection } from "./graph/edge/EdgeDirection";
export { RenderMode } from "./render/RenderMode";
export { TransitionMode } from "./state/TransitionMode";
export { Alignment } from "./viewer/Alignment";
export { ImageSize } from "./viewer/ImageSize";
export { Viewer } from "./viewer/Viewer";

// tslint:disable:variable-name

// API module
import { BufferFetcher } from "./api/BufferFetcher";
import { DataProviderBase } from "./api/DataProviderBase";
import { FalcorDataProvider } from "./api/FalcorDataProvider";
import { GeometryProviderBase } from "./api/GeometryProviderBase";
import { GeohashGeometryProvider } from "./api/GeohashGeometryProvider";
import { JsonInflator } from "./api/JsonInflator";
import { PbfMeshReader } from "./api/PbfMeshReader";
import { S2GeometryProvider } from "./api/S2GeometryProvider";
export const API = {
    BufferFetcher: BufferFetcher,
    DataProviderBase: DataProviderBase,
    FalcorDataProvider: FalcorDataProvider,
    GeometryProviderBase: GeometryProviderBase,
    GeohashGeometryProvider: GeohashGeometryProvider,
    JsonInflator: JsonInflator,
    PbfMeshReader: PbfMeshReader,
    S2GeometryProvider: S2GeometryProvider,
};

// Geo module
import { GeoCoords } from "./geo/GeoCoords";
export const Geo = {
    GeoCoords: GeoCoords,
};

// Tag component module
import { ExtremePointTag } from "./component/tag/tag/ExtremePointTag";
import { GeometryTagError } from "./component/tag/error/GeometryTagError";
import { PointGeometry } from "./component/tag/geometry/PointGeometry";
import { PointsGeometry } from "./component/tag/geometry/PointsGeometry";
import { PolygonGeometry } from "./component/tag/geometry/PolygonGeometry";
import { OutlineTag } from "./component/tag/tag/OutlineTag";
import { RectGeometry } from "./component/tag/geometry/RectGeometry";
import { SpotTag } from "./component/tag/tag/SpotTag";
import { TagDomain } from "./component/tag/tag/TagDomain";
import { TagMode } from "./component/tag/TagMode";
export const TagComponent = {
    ExtremePointTag: ExtremePointTag,
    GeometryTagError: GeometryTagError,
    PointGeometry: PointGeometry,
    PointsGeometry: PointsGeometry,
    PolygonGeometry: PolygonGeometry,
    OutlineTag: OutlineTag,
    RectGeometry: RectGeometry,
    SpotTag: SpotTag,
    TagDomain: TagDomain,
    TagComponent: ExportTagComponent,
    TagMode: TagMode,
};

// Marker component module
import { CircleMarker } from "./component/marker/marker/CircleMarker";
import { SimpleMarker } from "./component/marker/marker/SimpleMarker";
export const MarkerComponent = {
    CircleMarker: CircleMarker,
    SimpleMarker: SimpleMarker,
    MarkerComponent: ExportMarkerComponent,
};

// Popup component module
import { Popup } from "./component/popup/popup/Popup";
export const PopupComponent = {
    Popup: Popup,
    PopupComponent: ExportPopupComponent,
};

// Spatial data component module
import { CameraVisualizationMode } from "./component/spatialdata/CameraVisualizationMode";
import { OriginalPositionMode } from "./component/spatialdata/OriginalPositionMode";
export const SpatialDataComponent = {
    CameraVisualizationMode: CameraVisualizationMode,
    OriginalPositionMode: OriginalPositionMode,
    SpatialDataComponent: ExportSpatialDataComponent,
};

 // tslint:enable:variable-name
