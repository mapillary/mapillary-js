import { LngLat } from "./LngLat";

/**
 * Interface that represents a latitude-longitude reference
 * of a reconstruction, measured in degrees and an
 * altitude in meters. Coordinates are defined in the WGS84 datum.
 *
 * @interface LatLonAlt
 */
export interface LatLonAlt extends LngLat {
    /**
     * Altitude, measured in meters.
     */
    alt: number;
}
