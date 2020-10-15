import ILatLon from "./interfaces/ILatLon";

export interface IGeometryProvider {
    /**
     * Convert a geodetic bounding box to the  the minimum set
     * of cell ids containing the bounding box.
     *
     * @description The bounding box needs
     * to be sufficiently small to be contained in an area with the size
     * of maximally four tiles. Up to nine adjacent tiles may be returned.
     *
     * @param {ILatLon} sw - South west corner of bounding box.
     * @param {ILatLon} ne - North east corner of bounding box.
     *
     * @returns {string} Cells containing the bounding box.
     */
    bboxToCellIds(sw: ILatLon, ne: ILatLon): string[];

    /**
     * Convert geodetic coordinates to a cell id.
     *
     * @param {ILatLon} latlon - Latitude and longitude to convert.
     * @returns {string} Cell for the latitude, longitude.
     */
    latLonToCellId(latLon: ILatLon): string;


    /**
     * Convert a geodetic square to cell ids.
     *
     * The square is specified as a latitude, longitude
     * and a threshold from the position using Manhattan distance.
     *
     * @param {ILatLon} latlon - Latitude and longitude.
     * @param {number} threshold - Threshold of the conversion in meters.
     *
     * @returns {string} Cells reachable within the threshold.
     */
    latLonToCellIds(latLon: ILatLon, threshold: number): string[];
}

export default IGeometryProvider;
