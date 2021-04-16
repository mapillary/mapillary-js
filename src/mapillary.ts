/**
 * @module mapillary
 *
 * @description
 *
 * MapillaryJS
 *
 * Interactive, customizable street imagery viewer in
 * the browser, powered by WebGL.
 *
 * MapillaryJS works with a few different coordinate systems.
 *
 * Container pixel coordinates
 *
 * Pixel coordinates are coordinates on the viewer container. The origin is
 * in the top left corner of the container. The axes are
 * directed according to the following for a viewer container with a width
 * of 640 pixels and height of 480 pixels.
 *
 * ```js
 * (0,0)                          (640, 0)
 *      +------------------------>
 *      |
 *      |
 *      |
 *      v                        +
 * (0, 480)                       (640, 480)
 * ```
 *
 * Basic image coordinates
 *
 * Basic image coordinates represents points in the original image adjusted for
 * orientation. They range from 0 to 1 on both axes. The origin is in the top left
 * corner of the image and the axes are directed
 * according to the following for all image types.
 *
 * ```js
 * (0,0)                          (1, 0)
 *      +------------------------>
 *      |
 *      |
 *      |
 *      v                        +
 * (0, 1)                         (1, 1)
 * ```
 *
 * For every camera viewing direction it is possible to convert between these
 * two coordinate systems for the current image. The image can be panned and
 * zoomed independently of the size of the viewer container resulting in
 * different conversion results for different viewing directions.
 */

// Bootstrap (internal)
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
import { TraversingState } from "./state/state/TraversingState";
TraversingState.register(UnitBezier);

// Bootstrap components
import { ComponentService } from "./component/ComponentService";

import { AttributionComponent }
    from "./component/attribution/AttributionComponent";
import { BearingComponent } from "./component/bearing/BearingComponent";
import { CacheComponent } from "./component/cache/CacheComponent";
import { CoverComponent } from "./component/cover/CoverComponent";
import { DirectionComponent } from "./component/direction/DirectionComponent";
import { ImageFallbackComponent } from "./component/fallback/image/ImageFallbackComponent";
import { ImageComponent }
    from "./component/image/ImageComponent";
import { KeyboardComponent } from "./component/keyboard/KeyboardComponent";
import { MarkerComponent } from "./component/marker/MarkerComponent";
import { MouseComponent } from "./component/mouse/MouseComponent";
import { NavigationFallbackComponent }
    from "./component/fallback/navigation/NavigationFallbackComponent";
import { PopupComponent } from "./component/popup/PopupComponent";
import { SequenceComponent } from "./component/sequence/SequenceComponent";
import { SliderComponent } from "./component/slider/SliderComponent";
import { SpatialComponent }
    from "./component/spatial/SpatialComponent";
import { TagComponent } from "./component/tag/TagComponent";
import { ZoomComponent } from "./component/zoom/ZoomComponent";

ComponentService.registerCover(CoverComponent);

ComponentService.register(AttributionComponent);
ComponentService.register(BearingComponent);
ComponentService.register(CacheComponent);
ComponentService.register(DirectionComponent);
ComponentService.register(ImageFallbackComponent);
ComponentService.register(ImageComponent);
ComponentService.register(KeyboardComponent);
ComponentService.register(MarkerComponent);
ComponentService.register(MouseComponent);
ComponentService.register(NavigationFallbackComponent);
ComponentService.register(PopupComponent);
ComponentService.register(SequenceComponent);
ComponentService.register(SliderComponent);
ComponentService.register(SpatialComponent);
ComponentService.register(TagComponent);
ComponentService.register(ZoomComponent);

// Mapillary module
export { isFallbackSupported, isSupported } from "./util/Support";

// Viewer types
export { Alignment } from "./viewer/enums/Alignment";
export { IViewer } from "./viewer/interfaces/IViewer";
export { ICustomRenderer } from "./viewer/interfaces/ICustomRenderer";
export { PointOfView } from "./viewer/interfaces/PointOfView";
export { RenderMode } from "./render/RenderMode";
export { RenderPass } from "./viewer/enums/RenderPass";
export { TransitionMode } from "./state/TransitionMode";
export { Viewer } from "./viewer/Viewer";

// Viewer events
export { ViewerBearingEvent } from "./viewer/events/ViewerBearingEvent";
export { ViewerEvent } from "./viewer/events/ViewerEvent";
export { ViewerEventType } from "./viewer/events/ViewerEventType";
export { ViewerImageEvent } from "./viewer/events/ViewerImageEvent";
export { ViewerLoadingEvent } from "./viewer/events/ViewerLoadingEvent";
export { ViewerMouseEvent } from "./viewer/events/ViewerMouseEvent";
export { ViewerNavigableEvent } from "./viewer/events/ViewerNavigableEvent";
export { ViewerNavigationEdgeEvent }
    from "./viewer/events/ViewerNavigationEdgeEvent";
export { ViewerStateEvent } from "./viewer/events/ViewerStateEvent";

// Viewer options
export { ComponentOptions } from "./viewer/options/ComponentOptions";
export { FallbackOptions } from "./viewer/options/FallbackOptions";
export { UrlOptions } from "./viewer/options/UrlOptions";
export { ViewerOptions } from "./viewer/options/ViewerOptions";

// Graph
export { Image } from "./graph/Image";
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
export * as Component from "./export/ComponentNamespace";
export * as Geo from "./export/GeoNamespace";
export * as Tile from "./export/TileNamespace";

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
export * as SpatialComponent from "./export/SpatialNamespace";
export * as TagComponent from "./export/TagNamespace";
export * as ZoomComponent from "./export/ZoomNamespace";
