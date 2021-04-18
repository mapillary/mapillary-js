/**
 * @module viewer
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

// Support
export { isFallbackSupported, isSupported } from "../util/Support";

// Viewer types
export { Alignment } from "../viewer/enums/Alignment";
export { IViewer } from "../viewer/interfaces/IViewer";
export { ICustomRenderer } from "../viewer/interfaces/ICustomRenderer";
export { PointOfView } from "../viewer/interfaces/PointOfView";
export { RenderMode } from "../render/RenderMode";
export { RenderPass } from "../viewer/enums/RenderPass";
export { TransitionMode } from "../state/TransitionMode";
export { Viewer } from "../viewer/Viewer";

// Viewer events
export { ViewerBearingEvent } from "../viewer/events/ViewerBearingEvent";
export { ViewerEvent } from "../viewer/events/ViewerEvent";
export { ViewerEventType } from "../viewer/events/ViewerEventType";
export { ViewerImageEvent } from "../viewer/events/ViewerImageEvent";
export { ViewerLoadingEvent } from "../viewer/events/ViewerLoadingEvent";
export { ViewerMouseEvent } from "../viewer/events/ViewerMouseEvent";
export { ViewerNavigableEvent } from "../viewer/events/ViewerNavigableEvent";
export { ViewerNavigationEdgeEvent }
    from "../viewer/events/ViewerNavigationEdgeEvent";
export { ViewerStateEvent } from "../viewer/events/ViewerStateEvent";

// Viewer options
export { ComponentOptions } from "../viewer/options/ComponentOptions";
export { FallbackOptions } from "../viewer/options/FallbackOptions";
export { UrlOptions } from "../viewer/options/UrlOptions";
export { ViewerOptions } from "../viewer/options/ViewerOptions";

// Graph
export { Image } from "../graph/Image";
export { NavigationDirection } from "../graph/edge/NavigationDirection";
export { NavigationEdge } from "../graph/edge/interfaces/NavigationEdge";
export { NavigationEdgeData } from "../graph/edge/interfaces/NavigationEdgeData";
export { NavigationEdgeStatus } from "../graph/interfaces/NavigationEdgeStatus";
export {
    CombiningFilterExpression,
    CombiningFilterOperator,
    ComparisonFilterExpression,
    ComparisonFilterOperator,
    FilterExpression,
    FilterKey,
    FilterOperator,
    FilterValue,
    SetMembershipFilterExpression,
    SetMembershipFilterOperator,
} from "../graph/FilterExpression";

// Error
export { AbortMapillaryError } from "../error/AbortMapillaryError";
export { MapillaryError } from "../error/MapillaryError";
