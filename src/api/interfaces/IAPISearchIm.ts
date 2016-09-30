/**
 * Interface that describes the raw image response
 * from search API.
 */
export interface IAPISearchIm {
    /**
     * Angle of the image shot in degrees between 0 to 360
     */
    ca?: number;

    /**
     * Time image was captured in EPOCH ms
     */
    captured_at?: number;

    /**
     * Key of the image
     */
    key: string;

    /**
     * Longitude of image
     */
    lon?: number;

    /**
     * Latitude of image
     */
    lat?: number;

    /**
     * String representation of where image was shot
     */
    location?: string;

    /**
     * Username of user who uploaded the image
     */
    user?: string;
}

export default IAPISearchIm;
