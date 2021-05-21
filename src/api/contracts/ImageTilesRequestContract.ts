/**
 * Contract describing image tile requests.
 */
export interface ImageTilesRequestContract {
    /**
     * ID of the tile's image.
     */
    imageId: string;

    /**
     * Tile level.
     */
    z: number;
}
