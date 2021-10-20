import { LngLat } from "./LngLat";

/**
 * @interface IGeometryProvider
 *
 * Interface describing geometry provider members.
 *
 * This is a specification for implementers to model: it
 * is not an exported method or class.
 */
export interface IGeometryProvider {
    /**
     * Convert a geodetic bounding box to the the minimum set
     * of cell ids containing the bounding box.
     *
     * @description The bounding box needs
     * to be sufficiently small to be contained in an area with the size
     * of maximally four tiles. Up to nine adjacent tiles may be returned.
     *
     * @param {LngLat} sw - South west corner of bounding box.
     * @param {LngLat} ne - North east corner of bounding box.
     *
     * @returns {Array<string>} Array of cell ids.
     */
    bboxToCellIds(sw: LngLat, ne: LngLat): string[];

    /**
     * Get the cell ids of all adjacent cells.
     *
     * @description In the case of approximately rectangular cells
     * this is typically the eight orthogonally and diagonally adjacent
     * cells.
     *
     * @param {string} cellId - Id of cell.
     * @returns {Array<string>} Array of cell ids. No specific
     * order is guaranteed.
     */
    getAdjacent(cellId: string): string[];

    /**
     * Get the vertices of a cell.
     *
     * @description The vertices form an unclosed
     * clockwise polygon in the 2D longitude, latitude
     * space. No assumption on the position of the first
     * vertex relative to the others can be made.
     *
     * @param {string} cellId - Id of cell.
     * @returns {Array<LngLat>} Unclosed clockwise polygon.
     */
    getVertices(cellId: string): LngLat[];

    /**
     * Convert geodetic coordinates to a cell id.
     *
     * @param {LngLat} lngLat - Longitude, latitude to convert.
     * @returns {string} Cell id for the longitude, latitude.
     */
    lngLatToCellId(lngLat: LngLat): string;
}
