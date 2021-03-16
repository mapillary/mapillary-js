import { BearingConfiguration } from "../../component/interfaces/BearingConfiguration";
import { CacheConfiguration } from "../../component/interfaces/CacheConfiguration";
import { DirectionConfiguration } from "../../component/interfaces/DirectionConfiguration";
import { KeyboardConfiguration } from "../../component/interfaces/KeyboardConfiguration";
import { MarkerConfiguration } from "../../component/interfaces/MarkerConfiguration";
import { MouseConfiguration } from "../../component/interfaces/MouseConfiguration";
import { NavigationConfiguration } from "../../component/interfaces/NavigationConfiguration";
import { SequenceConfiguration } from "../../component/interfaces/SequenceConfiguration";
import { SliderConfiguration } from "../../component/interfaces/SliderConfiguration";
import { SpatialDataConfiguration } from "../../component/interfaces/SpatialDataConfiguration";
import { TagConfiguration } from "../../component/interfaces/TagConfiguration";
import { ZoomConfiguration } from "../../component/interfaces/ZoomConfiguration";

/**
 * Interface for the component options that can be provided to the viewer.
 *
 * @interface
 */
export interface ComponentOptions {
    /**
     * Show attribution.
     *
     * @default true
     */
    attribution?: boolean;

    /**
     * Display a background if no key is set.
     *
     * @default false
     */
    background?: boolean;

    /**
     * Show indicator for bearing and field of view.
     *
     * @default true
     */
    bearing?: boolean | BearingConfiguration;

    /**
     * Cache images around the current one.
     *
     * @default true
     */
    cache?: boolean | CacheConfiguration;

    /**
     * Use a cover and avoid loading initial data from Mapillary.
     *
     * @default true
     */
    cover?: boolean;

    /**
     * Show debug interface.
     * @default false
     */
    debug?: boolean;

    /**
     * Show spatial direction arrows for navigation.
     *
     * @description Default spatial navigation when there is WebGL support.
     * Requires WebGL support.
     *
     * @default true
     */
    direction?: boolean | DirectionConfiguration;

    /**
     * Show static images without pan, zoom, or transitions.
     *
     * @description Fallback for `imagePlane` when WebGL is not supported.
     *
     * @default false
     */
    image?: boolean;

    /**
     * Show image planes in 3D.
     *
     * @description Requires WebGL support.
     *
     * @default true
     */
    imagePlane?: boolean;

    /**
     * Enable use of keyboard commands.
     *
     * @description Requires WebGL support.
     *
     * @default true
     */
    keyboard?: boolean | KeyboardConfiguration;

    /**
     * Enable an interface for showing 3D markers in the viewer.
     *
     * @description Requires WebGL support.
     *
     * @default false
     */
    marker?: boolean | MarkerConfiguration;

    /**
     * Enable mouse and touch interaction for zoom and pan.
     *
     * @description Requires WebGL support.
     *
     * @default true
     */
    mouse?: boolean | MouseConfiguration;

    /**
     * Show static navigation arrows in the corners.
     *
     * @description Fallback for `direction` and `sequence` when WebGL is not supported.
     *
     * @default false
     */
    navigation?: boolean | NavigationConfiguration;

    /**
     * Show HTML popups over images.
     *
     * @description Requires WebGL support.
     *
     * @default false
     */
    popup?: boolean;

    /**
     * Create a route with a story.
     *
     * @default false
     */
    route?: boolean;

    /**
     * Show sequence related navigation.
     *
     * @description Default sequence navigation when there is WebGL support.
     *
     * @default true
     */
    sequence?: boolean | SequenceConfiguration;

    /**
     * Show a slider for transitioning between image planes.
     *
     * @description Requires WebGL support.
     *
     * @default false
     */
    slider?: boolean | SliderConfiguration;

    /**
     * Enable an interface for showing spatial data in the viewer.
     *
     * @description Requires WebGL support.
     *
     * @default false
     */
    spatialData?: boolean | SpatialDataConfiguration;

    /**
     * Enable an interface for drawing 2D geometries on top of images.
     *
     * @description Requires WebGL support.
     *
     * @default false
     */
    tag?: boolean | TagConfiguration;

    /**
     * Show buttons for zooming in and out.
     *
     * @description Requires WebGL support.
     *
     * @default true
     */
    zoom?: boolean | ZoomConfiguration;
}
