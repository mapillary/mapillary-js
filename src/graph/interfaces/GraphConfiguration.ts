/**
 * Interface for graph configuration.
 *
 * @interface GraphConfiguration
 */
export interface GraphConfiguration {
    /**
     * The maximum number of cached sequences left
     * after uncache.
     */
    maxSequences: number;

    /**
     * The maximum number of unused cached images left
     * after uncache.
     */
    maxUnusedImages: number;

    /**
     * The maximum number of unused pre-stored cached images left
     * after uncache.
     */
    maxUnusedPreStoredImages: number;

    /**
     * The maximum number of unused cached tiles left
     * after uncache.
     */
    maxUnusedTiles: number;
}
