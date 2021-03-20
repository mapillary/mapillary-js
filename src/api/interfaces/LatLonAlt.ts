import { LatLon } from "./LatLon";

/**
 * Interface that represents a latitude-longitude reference
 * of a reconstruction, measured in degrees and an
 * altitude in meters. Coordinates are defined in the WGS84 datum.
 *
 * @interface LatLonAlt
 */
export interface LatLonAlt extends LatLon {
    /**
     * Altitude, measured in meters.
     */
    alt: number;
}
