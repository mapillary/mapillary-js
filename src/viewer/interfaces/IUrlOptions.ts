/**
 * Interface for the URL options that can be provided to the viewer.
 *
 * @interface
 */
export interface IUrlOptions {
    /**
     * API v3 host.
     *
     * @description Used for calling the API for image data.
     *
     * @default {"a.mapillary.com"}
     */
    apiHost?: string;

    /**
     * Explore host.
     *
     * @description Host used for links to the full
     * mapillary website.
     *
     * @default {"www.mapillary.com"}
     */
    exploreHost?: string;

    /**
     * Image host.
     *
     * @description Used for retrieving image thumbnails.
     *
     * @default {"d1cuyjsrcm0gby.cloudfront.net"}
     */
    imageHost?: string;

    /**
     * Image tile host.
     *
     * @description Used for retrieving high resolution
     * image tiles when zooming.
     *
     * @default {"d2qb1440i7l50o.cloudfront.net"}
     */
    imageTileHost?: string;

    /**
     * Mesh host.
     *
     * @description Used for retriving a 3D mesh for
     * each image.
     *
     * @default {"d1brzeo354iq2l.cloudfront.net"}
     */
    meshHost?: string;

    /**
     * Scheme.
     *
     * @description Used for all hosts.
     *
     * @default {"https"}
     */
    scheme?: string;
}

export default IUrlOptions;
