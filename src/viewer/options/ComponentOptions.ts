import { BearingConfiguration } from "../../component/interfaces/BearingConfiguration";
import { CacheConfiguration } from "../../component/interfaces/CacheConfiguration";
import { DirectionConfiguration } from "../../component/interfaces/DirectionConfiguration";
import { KeyboardConfiguration } from "../../component/interfaces/KeyboardConfiguration";
import { MarkerConfiguration } from "../../component/interfaces/MarkerConfiguration";
import { PointerConfiguration } from "../../component/interfaces/PointerConfiguration";
import { SequenceConfiguration } from "../../component/interfaces/SequenceConfiguration";
import { SliderConfiguration } from "../../component/interfaces/SliderConfiguration";
import { SpatialConfiguration } from "../../component/interfaces/SpatialConfiguration";
import { TagConfiguration } from "../../component/interfaces/TagConfiguration";
import { ZoomConfiguration } from "../../component/interfaces/ZoomConfiguration";
import { FallbackOptions } from "./FallbackOptions";

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
     * Use a cover to avoid loading data until viewer interaction.
     *
     * @default true
     */
    cover?: boolean;

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
     * Enable fallback component options
     * when the browser does not have WebGL support.
     *
     * @default undefined
     */
    fallback?: FallbackOptions;

    /**
     * Show image planes in 3D.
     *
     * @description Requires WebGL support.
     *
     * @default true
     */
    image?: boolean;

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
     * Enable mouse, pen, and touch interaction for zoom and pan.
     *
     * @description Requires WebGL support.
     *
     * @default true
     */
    pointer?: boolean | PointerConfiguration;

    /**
     * Show HTML popups over images.
     *
     * @description Requires WebGL support.
     *
     * @default false
     */
    popup?: boolean;

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
    spatial?: boolean | SpatialConfiguration;

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
