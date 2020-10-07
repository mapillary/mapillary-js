import ModelCreator from "./ModelCreator";

/**
 * Interface for the options that can be provided to the {@link DataProvider}.
 *
 * @interface
 */
export interface IDataProviderOptions {
    /**
     * API v3 host.
     *
     * @description Used for calling the API for image data.
     *
     * @default {"a.mapillary.com"}
     */
    apiHost?: string;

    /**
     * Client id for API requests.
     */
    clientId: string;

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
     * Optional model creator instance.
     */
    creator?: ModelCreator;

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

    /**
     * Optional OAuth token for API requests of
     * protected resources.
     */
    token?: string;
}

export default IDataProviderOptions;
