import {ImageSize} from "../../Viewer";

export interface IViewerOptions {
    /**
     * Show attribution
     * @member Mapillary.IViewerOptions#attribution
     * @type {boolean=true}
     */
    attribution?: boolean;

    /**
     * Cache images ahead.
     * @member Mapillary.IViewerOptions#cache
     * @type {boolean=true}
     */
    cache?: boolean;

    /**
     * Use a cover and avoid loading initial data from Mapillary.
     * @member Mapillary.IViewerOptions#cover
     * @type {boolean=true}
     */
    cover?: boolean;

    /**
     * Show debug interface.
     * @member Mapillary.IViewerOptions#debug
     * @type {boolean=false}
     */
    debug?: boolean;

    /**
     * Show direction arrows for navigation.
     * @member Mapillary.IViewerOptions#direction
     * @type {boolean=true}
     */
    direction?: boolean;

    /**
     * Show static navigation arrows in the corners.
     * @member Mapillary.IViewerOptions#navigation
     * @type {boolean=false}
     */
    navigation?: boolean;

    /**
     * Show static images without transitions.
     * @member Mapillary.IViewerOptions#image
     * @type {boolean=true}
     */
    image?: boolean;

    /**
     * Show image planes in 3D using WebGL.
     * @member Mapillary.IViewerOptions#imageplane
     * @type {boolean=true}
     */
    imageplane?: boolean;

    /**
     * Enable use of keyboard commands.
     * @member Mapillary.IViewerOptions#keyboard
     * @type {boolean=true}
     */
    keyboard?: boolean;

    /**
     * Show indication of loading.
     * @member Mapillary.IViewerOptions#loading
     * @type {boolean=true}
     */
    loading?: boolean;

    /**
     * Enable mouse interface (needed for panorama navigation)
     * @member Mapillary.IViewerOptions#mouse
     * @type {boolean=true}
     */
    mouse?: boolean;

    /**
     * Add play ability to the viewer.
     * @member Mapillary.IViewerOptions#player
     * @type {boolean=false}
     */
    player?: boolean;

    /**
     * Default size of the thumbnail used in the viewer
     * @member Mapillary.IViewerOptions#baseImageSize
     * @type {ImageSize}
     */
    baseImageSize?: ImageSize;

    /**
     * The max size of an image shown in the viewer
     * will be used when user pauses.
     * @member Mapillary.IViewerOptions#maxImageSize
     * @type {ImageSize}
     */
    maxImageSize?: ImageSize;
}

export default IViewerOptions;
