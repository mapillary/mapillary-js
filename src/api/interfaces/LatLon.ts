/**
 * Interface that represents a latitude and longitude coordinate,
 * measured in degrees. Coordinates are defined in the WGS84 datum.
 *
 * @interface LatLon
 */
export interface LatLon {
    /**
     * Latitude, measured in degrees.
     */
    lat: number;

    /**
     * Longitude, measured in degrees.
     */
    lon: number;
}
