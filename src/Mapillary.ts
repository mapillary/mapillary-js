/**
 * MapillaryJS is a JavaScript and WebGL library for exploring
 * street level imagery.
 * @name Mapillary
 */

// Bootstrap components
import { ComponentService } from "./component/ComponentService";

import { AttributionComponent } from "./component/AttributionComponent";
import { BackgroundComponent } from "./component/BackgroundComponent";
import { BearingComponent } from "./component/BearingComponent";
import { CacheComponent } from "./component/CacheComponent";
import { CoverComponent } from "./component/CoverComponent";
import { DebugComponent } from "./component/DebugComponent";
import { DirectionComponent } from "./component/direction/DirectionComponent";
import { ImageComponent } from "./component/ImageComponent";
import { ImagePlaneComponent } from "./component/imageplane/ImagePlaneComponent";
import { KeyboardComponent } from "./component/keyboard/KeyboardComponent";
import { MarkerComponent } from "./component/marker/MarkerComponent";
import { MouseComponent } from "./component/mouse/MouseComponent";
import { NavigationComponent } from "./component/NavigationComponent";
import { PopupComponent } from "./component/popup/PopupComponent";
import { RouteComponent } from "./component/RouteComponent";
import { SequenceComponent } from "./component/sequence/SequenceComponent";
import { SliderComponent } from "./component/slider/SliderComponent";
import { SpatialDataComponent } from "./component/spatialdata/SpatialDataComponent";
import { TagComponent } from "./component/tag/TagComponent";
import { ZoomComponent } from "./component/zoom/ZoomComponent";

ComponentService.registerCover(CoverComponent);

ComponentService.register(AttributionComponent);
ComponentService.register(BackgroundComponent);
ComponentService.register(BearingComponent);
ComponentService.register(CacheComponent);
ComponentService.register(DebugComponent);
ComponentService.register(DirectionComponent);
ComponentService.register(ImageComponent);
ComponentService.register(ImagePlaneComponent);
ComponentService.register(KeyboardComponent);
ComponentService.register(MarkerComponent);
ComponentService.register(MouseComponent);
ComponentService.register(NavigationComponent);
ComponentService.register(PopupComponent);
ComponentService.register(RouteComponent);
ComponentService.register(SequenceComponent);
ComponentService.register(SliderComponent);
ComponentService.register(SpatialDataComponent);
ComponentService.register(TagComponent);
ComponentService.register(ZoomComponent);

// Mapillary module
export { isFallbackSupported, isSupported } from "./utils/Support";

// Viewer types
export { RenderMode } from "./render/RenderMode";
export { TransitionMode } from "./state/TransitionMode";
export { Alignment } from "./viewer/Alignment";
export { ImageSize } from "./viewer/ImageSize";
export { Viewer } from "./viewer/Viewer";
export { IComponentOptions } from "./viewer/interfaces/IComponentOptions";
export { ComponentSize } from "./component/utils/ComponentSize";
export { IPointOfView } from "./viewer/interfaces/IPointOfView";
export { IUrlOptions } from "./viewer/interfaces/IUrlOptions";
export { IViewerEvent } from "./viewer/interfaces/IViewerEvent";
export { IViewerMouseEvent } from "./viewer/interfaces/IViewerMouseEvent";
export { IViewerOptions } from "./viewer/interfaces/IViewerOptions";

// Graph types
export { Node } from "./graph/Node";
export { EdgeDirection } from "./graph/edge/EdgeDirection";
export { IEdge } from "./graph/edge/interfaces/IEdge";
export { IEdgeData } from "./graph/edge/interfaces/IEdgeData";
export { IEdgeStatus } from "./graph/interfaces/IEdgeStatus";
export {
    FilterExpression,
    FilterOperation,
    FilterOperator,
    FilterValue,
} from "./graph/FilterExpression";

// Error types
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
