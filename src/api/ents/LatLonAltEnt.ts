import { LatLonEnt } from "./LatLonEnt";

/**
 * Interface that represents a latitude-longitude reference
 * of a reconstruction, measured in degrees and an
 * altitude in meters. Coordinates are defined in the WGS84 datum.
 *
 * @interface LatLonAltEnt
 */
export interface LatLonAltEnt extends LatLonEnt {
    /**
     * Altitude, measured in meters.
     */
    alt: number;
}
