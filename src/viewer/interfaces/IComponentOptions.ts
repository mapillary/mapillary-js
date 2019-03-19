import {
    IBearingConfiguration,
    ICacheConfiguration,
    IDirectionConfiguration,
    IKeyboardConfiguration,
    IMarkerConfiguration,
    IMouseConfiguration,
    INavigationConfiguration,
    ISequenceConfiguration,
    ISliderConfiguration,
    ISpatialDataConfiguration,
    ITagConfiguration,
    IZoomConfiguration,
} from "../../Component";

/**
 * Interface for the component options that can be provided to the viewer.
 *
 * @interface
 */
export interface IComponentOptions {
    /**
     * Show attribution.
     *
     * @default true
     */
    attribution?: boolean ;

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
    bearing?: boolean | IBearingConfiguration;

    /**
     * Cache images around the current one.
     *
     * @default true
     */
    cache?: boolean | ICacheConfiguration;

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
    direction?: boolean | IDirectionConfiguration;

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
    keyboard?: boolean | IKeyboardConfiguration;

    /**
     * Show indication of loading.
     *
     * @default true
     */
    loading?: boolean;

    /**
     * Enable an interface for showing 3D markers in the viewer.
     *
     * @description Requires WebGL support.
     *
     * @default false
     */
    marker?: boolean | IMarkerConfiguration;

    /**
     * Enable mouse and touch interaction for zoom and pan.
     *
     * @description Requires WebGL support.
     *
     * @default true
     */
    mouse?: boolean | IMouseConfiguration;

    /**
     * Show static navigation arrows in the corners.
     *
     * @description Fallback for `direction` and `sequence` when WebGL is not supported.
     *
     * @default false
     */
    navigation?: boolean | INavigationConfiguration;

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
    sequence?: boolean | ISequenceConfiguration;

    /**
     * Show a slider for transitioning between image planes.
     *
     * @description Requires WebGL support.
     *
     * @default false
     */
    slider?: boolean | ISliderConfiguration;

    /**
     * Enable an interface for showing spatial data in the viewer.
     *
     * @description Requires WebGL support.
     *
     * @default false
     */
    spatialData?: boolean | ISpatialDataConfiguration;

    /**
     * Contribute viewing stats to Mapillary.
     *
     * @default true
     */
    stats?: boolean;

    /**
     * Enable an interface for drawing 2D geometries on top of images.
     *
     * @description Requires WebGL support.
     *
     * @default false
     */
    tag?: boolean | ITagConfiguration;

    /**
     * Show buttons for zooming in and out.
     *
     * @description Requires WebGL support.
     *
     * @default true
     */
    zoom?: boolean | IZoomConfiguration;
}

export default IComponentOptions;
