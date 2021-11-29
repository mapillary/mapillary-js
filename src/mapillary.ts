/**
 * Internal bootstrap
 *
 * This is a workaround to make the CommonJS unit testing
 * work with Jest. Once Jest/Node supports ES6 modules
 * fully this should be removed. GeoRBush is registered
 * here only to avoid loading it during
 * unit tests.
 */
import { Graph } from "./graph/Graph";
import { MarkerSet } from "./component/marker/MarkerSet";
import { GeoRBush } from "./geo/GeoRBush";
Graph.register(GeoRBush);
MarkerSet.register(GeoRBush);

/**
 * Component bootstrap
 *
 * Register all components with component service
 * so that they can be activated in the viewer.
 */
import { ComponentService } from "./component/ComponentService";

// Cover
import { CoverComponent } from "./component/cover/CoverComponent";

ComponentService.registerCover(CoverComponent);

// Component
import { AttributionComponent }
    from "./component/attribution/AttributionComponent";
import { BearingComponent } from "./component/bearing/BearingComponent";
import { CacheComponent } from "./component/cache/CacheComponent";
import { DirectionComponent } from "./component/direction/DirectionComponent";
import { ImageComponent }
    from "./component/image/ImageComponent";
import { KeyboardComponent } from "./component/keyboard/KeyboardComponent";
import { MarkerComponent } from "./component/marker/MarkerComponent";
import { PointerComponent } from "./component/pointer/PointerComponent";
import { PopupComponent } from "./component/popup/PopupComponent";
import { SequenceComponent } from "./component/sequence/SequenceComponent";
import { SliderComponent } from "./component/slider/SliderComponent";
import { SpatialComponent }
    from "./component/spatial/SpatialComponent";
import { TagComponent } from "./component/tag/TagComponent";
import { ZoomComponent } from "./component/zoom/ZoomComponent";

ComponentService.register(AttributionComponent);
ComponentService.register(BearingComponent);
ComponentService.register(CacheComponent);
ComponentService.register(DirectionComponent);
ComponentService.register(ImageComponent);
ComponentService.register(KeyboardComponent);
ComponentService.register(MarkerComponent);
ComponentService.register(PointerComponent);
ComponentService.register(PopupComponent);
ComponentService.register(SequenceComponent);
ComponentService.register(SliderComponent);
ComponentService.register(SpatialComponent);
ComponentService.register(TagComponent);
ComponentService.register(ZoomComponent);

// Fallback
import { ImageFallbackComponent }
    from "./component/fallback/image/ImageFallbackComponent";
import { NavigationFallbackComponent }
    from "./component/fallback/navigation/NavigationFallbackComponent";

ComponentService.register(ImageFallbackComponent);
ComponentService.register(NavigationFallbackComponent);

/**
 * External exports
 *
 * Documented public API.
 */
export * from "./external/api";
export * from "./external/component";
export * from "./external/viewer";
