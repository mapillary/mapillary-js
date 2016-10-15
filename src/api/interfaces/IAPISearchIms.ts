import IAPISearchIm from "./IAPISearchIm";

/**
 * Interface that describes the raw images response
 * from the API.
 *
 * @interface IAPISearchIms
 */

export interface IAPISearchIms {
    /**
     * True if there are more images in pagination false if not.
     */
    more: boolean;

    /**
     * List of raw image response
     */
    ims: Array<IAPISearchIm>;
}

export default IAPISearchIms;
