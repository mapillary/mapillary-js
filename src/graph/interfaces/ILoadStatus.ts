/**
 * Interface that indicates load status.
 *
 * @interface ILoadStatus
 */
export interface ILoadStatus {
    /**
     * Number of loaded bytes.
     */
    loaded: number;

    /**
     * Total number of bytes to load.
     */
    total: number;
}

export default ILoadStatus;
