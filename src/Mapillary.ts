/**
 * MapillaryJS is a JavaScript and WebGL library for exploring
 * street level imagery.
 * @name Mapillary
 */

// Bootstrap
// This is a workaround to make the CommonJS unit testing
// work with Jest. Once Jest/Node supports ES6 modules
// fully this should be removed. GeoRBush and UnitBezier
// are registered here only to avoid loading them during
// unit tests.

// Bootstrap GeoRBush
import { Graph } from "./graph/Graph";
import { MarkerSet } from "./component/marker/MarkerSet";
import { GeoRBush } from "./geo/GeoRBush";
Graph.register(GeoRBush);
MarkerSet.register(GeoRBush);

// Bootstrap UnitBezier
import UnitBezier from "@mapbox/unitbezier";
import { TraversingState } from "./state/states/TraversingState";
TraversingState.register(UnitBezier);

// Bootstrap components
import { ComponentService } from "./component/ComponentService";

import { AttributionComponent } from "./component/attribution/AttributionComponent";
import { BearingComponent } from "./component/bearing/BearingComponent";
import { CacheComponent } from "./component/cache/CacheComponent";
import { CoverComponent } from "./component/cover/CoverComponent";
import { DirectionComponent } from "./component/direction/DirectionComponent";
import { ImageComponent } from "./component/image/ImageComponent";
import { ImagePlaneComponent } from "./component/imageplane/ImagePlaneComponent";
import { KeyboardComponent } from "./component/keyboard/KeyboardComponent";
import { MarkerComponent } from "./component/marker/MarkerComponent";
import { MouseComponent } from "./component/mouse/MouseComponent";
import { NavigationComponent } from "./component/navigation/NavigationComponent";
import { PopupComponent } from "./component/popup/PopupComponent";
import { SequenceComponent } from "./component/sequence/SequenceComponent";
import { SliderComponent } from "./component/slider/SliderComponent";
import { SpatialDataComponent } from "./component/spatialdata/SpatialDataComponent";
import { TagComponent } from "./component/tag/TagComponent";
import { ZoomComponent } from "./component/zoom/ZoomComponent";

ComponentService.registerCover(CoverComponent);

ComponentService.register(AttributionComponent);
ComponentService.register(BearingComponent);
ComponentService.register(CacheComponent);
ComponentService.register(DirectionComponent);
ComponentService.register(ImageComponent);
ComponentService.register(ImagePlaneComponent);
ComponentService.register(KeyboardComponent);
ComponentService.register(MarkerComponent);
ComponentService.register(MouseComponent);
ComponentService.register(NavigationComponent);
ComponentService.register(PopupComponent);
ComponentService.register(SequenceComponent);
ComponentService.register(SliderComponent);
ComponentService.register(SpatialDataComponent);
ComponentService.register(TagComponent);
ComponentService.register(ZoomComponent);

// Mapillary module
export { isFallbackSupported, isSupported } from "./utils/Support";

// Viewer types
export { Alignment } from "./viewer/enums/Alignment";
export { ComponentSize } from "./component/utils/ComponentSize";
export { ICustomRenderer } from "./viewer/interfaces/ICustomRenderer";
export { PointOfView } from "./viewer/interfaces/PointOfView";
export { RenderMode } from "./render/RenderMode";
export { RenderPass } from "./viewer/enums/RenderPass";
export { TransitionMode } from "./state/TransitionMode";
export { Viewer } from "./viewer/Viewer";

// Viewer events
export { ViewerEvent } from "./viewer/interfaces/ViewerEvent";
export { ViewerMouseEvent } from "./viewer/interfaces/ViewerMouseEvent";

// Viewer configuration
export { ComponentOptions } from "./viewer/interfaces/ComponentOptions";
export { UrlOptions } from "./viewer/interfaces/UrlOptions";
export { ViewerOptions } from "./viewer/interfaces/ViewerOptions";

// Graph
export { Node } from "./graph/Node";
export { NavigationDirection } from "./graph/edge/NavigationDirection";
export { NavigationEdge } from "./graph/edge/interfaces/NavigationEdge";
export { NavigationEdgeData } from "./graph/edge/interfaces/NavigationEdgeData";
export { NavigationEdgeStatus } from "./graph/interfaces/NavigationEdgeStatus";
export {
    FilterExpression,
    FilterOperation,
    FilterOperator,
    FilterValue,
} from "./graph/FilterExpression";

// Error
export { AbortMapillaryError } from "./error/AbortMapillaryError";
export { MapillaryError } from "./error/MapillaryError";

// Namespaces
export * as API from "./export/APINamespace";
export * as Geo from "./export/GeoNamespace";

// Component namespaces
export * as BearingComponent from "./export/BearingNamespace";
export * as CacheComponent from "./export/CacheNamespace";
export * as DirectionComponent from "./export/DirectionNamespace";
export * as KeyboardComponent from "./export/KeyboardNamespace";
export * as MarkerComponent from "./export/MarkerNamespace";
export * as MouseComponent from "./export/MouseNamespace";
export * as PopupComponent from "./export/PopupNamespace";
export * as SequenceComponent from "./export/SequenceNamespace";
export * as SliderComponent from "./export/SliderNamespace";
export * as SpatialDataComponent from "./export/SpatialDataNamespace";
export * as TagComponent from "./export/TagNamespace";
export * as ZoomComponent from "./export/ZoomNamespace";
