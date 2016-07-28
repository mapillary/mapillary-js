import {ImageSize} from "../../Viewer";
import {RenderMode} from "../../Render";

/**
 * Interface for the options that can be provided to the viewer.
 *
 * @interface
 */
export interface IViewerOptions {
    /**
     * Show attribution
     * @default true
     */
    attribution?: boolean;

    /**
     * Display a background if no key is set.
     * @default false
     */
    background?: boolean;

    /**
     * Show indicator for panoramas.
     * @default true
     */
    bearing?: boolean;

    /**
     * Cache images ahead.
     * @default true
     */
    cache?: boolean;

    /**
     * Use a cover and avoid loading initial data from Mapillary.
     * @default true
     */
    cover?: boolean;

    /**
     * Show debug interface.
     * @default false
     */
    debug?: boolean;

    /**
     * Show direction arrows for navigation.
     * @default true
     */
    direction?: boolean;

    /**
     * Show detection rectangles in images
     * @default false
     */
    detection?: boolean;

    /**
     * Show detection rectangles in images
     * @default false
     */
    tag?: boolean;

    /**
     * Contribute viewing stats to Mapillary
     * @default false
     */
    stats?: boolean;

    /**
     * Show static navigation arrows in the corners.
     * @default false
     */
    navigation?: boolean;

    /**
     * Show sequence related navigation.
     * @default true
     */
    sequence?: boolean;

    /**
     * Show static images without transitions.
     * @default false
     */
    image?: boolean;

    /**
     * Show image planes in 3D using WebGL.
     * @default true
     */
    imageplane?: boolean;

    /**
     * Show a slider for transitioning between image planes.
     * @default false
     */
    slider?: boolean;

    /**
     * Enable use of keyboard commands.
     * @default true
     */
    keyboard?: boolean;

    /**
     * Show indication of loading.
     * @default true
     */
    loading?: boolean;

    /**
     * Enable an interface for showing markers in the viewer
     * @default false
     */
    marker?: boolean;

    /**
     * Enable mouse interface (needed for panorama navigation)
     * @default true
     */
    mouse?: boolean;

    /**
     * Create a route with a story inside mapillary js
     * @default false
     */
    route?: boolean;

    /**
     * Default size of the thumbnail used in the viewer
     * @default {ImageSize.Size640}
     */
    baseImageSize?: ImageSize;

    /**
     * Default size of the thumbnail used for panoramas in the viewer
     * @default {ImageSize.Size2048}
     */
    basePanoramaSize?: ImageSize;

    /**
     * The max size of an image shown in the viewer
     * will be used when user pauses.
     * @default {ImageSize.Size2048}
     */
    maxImageSize?: ImageSize;

    /**
     * The render mode in the viewer.
     * @default {RenderMode.Letterbox}
     */
    renderMode?: RenderMode;

    /**
     * A base URL for retrieving a png sprite image and json metadata file.
     * File name extensions will be automatically appended.
     */
    sprite?: string;
}

export default IViewerOptions;
