/**
 * Enumeration for graph modes.
 * @enum {number}
 * @readonly
 * @description Modes for the retrieval and caching performed
 * by the graph service on the graph.
 */
export enum GraphMode {
    /**
     * Caching is performed on sequences only and sequence edges are
     * calculated. Spatial tiles
     * are not retrieved and spatial edges are not calculated when
     * caching nodes. Complete sequences are being cached for requested
     * nodes within the graph.
     */
    Sequence,

    /**
     * Caching is performed with emphasis on spatial data. Sequence edges
     * as well as spatial edges are cached. Sequence data
     * is still requested but complete sequences are not being cached
     * for requested nodes.
     *
     * This is the initial mode of the graph service.
     */
    Spatial,
}

export default GraphMode;
