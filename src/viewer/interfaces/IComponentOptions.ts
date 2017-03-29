import {
    ICacheConfiguration,
    IDirectionConfiguration,
    IMarkerConfiguration,
    IMouseConfiguration,
    ISequenceConfiguration,
    ISliderConfiguration,
    ITagConfiguration,
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
    bearing?: boolean;

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
     * @default true
     */
    direction?: boolean | IDirectionConfiguration;

    /**
     * Show static images without transitions.
     *
     * @default false
     */
    image?: boolean;

    /**
     * Show image planes in 3D using WebGL.
     *
     * @default true
     */
    imagePlane?: boolean;

    /**
     * Enable use of keyboard commands.
     *
     * @default true
     */
    keyboard?: boolean;

    /**
     * Show indication of loading.
     *
     * @default true
     */
    loading?: boolean;

    /**
     * Enable an interface for showing 3D markers in the viewer.
     *
     * @default false
     */
    marker?: boolean | IMarkerConfiguration;

    /**
     * Enable mouse and touch interaction for zoom and pan.
     *
     * @default true
     */
    mouse?: boolean | IMouseConfiguration;

    /**
     * Show static navigation arrows in the corners.
     *
     * @default false
     */
    navigation?: boolean;

    /**
     * Create a route with a story.
     *
     * @default false
     */
    route?: boolean;

    /**
     * Show sequence related navigation.
     *
     * @default true
     */
    sequence?: boolean | ISequenceConfiguration;

    /**
     * Show a slider for transitioning between image planes.
     *
     * @default false
     */
    slider?: boolean | ISliderConfiguration;

    /**
     * Contribute viewing stats to Mapillary.
     *
     * @default true
     */
    stats?: boolean;

    /**
     * Enable an interface for drawing 2D geometries on top of images.
     *
     * @default false
     */
    tag?: boolean | ITagConfiguration;
}

export default IComponentOptions;
