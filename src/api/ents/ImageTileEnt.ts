/**
 * Ent representing image tile properties.
 */
export interface ImageTileEnt {
    /**
     * URL for fetching image tile pixel data.
     */
    url: string,

    /**
     * X tile coordinate.
     */
    x: number,

    /**
     * Y tile coordinate.
     */
    y: number,

    /**
     * Tile level.
     */
    z: number,
}
