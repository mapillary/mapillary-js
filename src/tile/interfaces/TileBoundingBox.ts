/**
 * Interface that describes a bounding box.
 *
 * @interface TileBoundingBox
 */
export interface TileBoundingBox {
    /**
     * The minimum x value.
     */
    minX: number;

    /**
     * The minimum y value.
     */
    minY: number;

    /**
     * The maximum x value.
     */
    maxX: number;

    /**
     * The maximum y value.
     */
    maxY: number;
}
