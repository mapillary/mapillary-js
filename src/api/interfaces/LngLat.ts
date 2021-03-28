/**
 * Interface that represents a latitude and longitude coordinate,
 * measured in degrees. Coordinates are defined in the WGS84 datum.
 */
export interface LngLat {
    /**
     * Latitude, measured in degrees.
     */
    lat: number;

    /**
     * Longitude, measured in degrees.
     */
    lng: number;
}
