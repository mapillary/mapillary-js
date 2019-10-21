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
     * Cluster reconstruction host.
     *
     * @description Used for retrieving the cluster reconstructions
     * for showing point clouds.
     *
     * @default {"cluster-reconstructions.mapillary.com"}
     */
    clusterReconstructionHost?: string;

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
     * @default {"images.mapillary.com"}
     */
    imageHost?: string;

    /**
     * Image tile host.
     *
     * @description Used for retrieving high resolution
     * image tiles when zooming.
     *
     * @default {"loris.mapillary.com"}
     */
    imageTileHost?: string;

    /**
     * Mesh host.
     *
     * @description Used for retriving a 3D mesh for
     * each image.
     *
     * @default {"meshes.mapillary.com"}
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
