/**
 * Interface that describes panorama metadata.
 *
 * @interface IGPano
 */
export interface IGPano {
    /**
     * Margin of cropped area to left border in pixels.
     */
    CroppedAreaLeftPixels: number;

    /**
     * Margin of cropped area to top border in pixels.
     */
    CroppedAreaTopPixels: number;

    /**
     * Height of cropped area in pixels.
     */
    CroppedAreaImageHeightPixels: number;

    /**
     * Width of cropped area in pixels.
     */
    CroppedAreaImageWidthPixels: number;

    /**
     * Full height in pixels.
     */
    FullPanoHeightPixels: number;

    /**
     * Full width in pixels.
     */
    FullPanoWidthPixels: number;
}

export default IGPano;
