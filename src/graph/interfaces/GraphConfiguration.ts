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
     * The maximum number of unused cached nodes left
     * after uncache.
     */
    maxUnusedNodes: number;

    /**
     * The maximum number of unused pre-stored cached nodes left
     * after uncache.
     */
    maxUnusedPreStoredNodes: number;

    /**
     * The maximum number of unused cached tiles left
     * after uncache.
     */
    maxUnusedTiles: number;
}
