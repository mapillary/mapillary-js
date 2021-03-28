import { LngLat } from "./LngLat";

/**
 * Interface that represents longitude-latitude-altitude
 * coordinates. Longitude and latitude are measured in degrees
 * and altitude in meters. Coordinates are defined in the WGS84 datum.
 *
 * @interface
 */
export interface LngLatAlt extends LngLat {
    /**
     * Altitude, measured in meters.
     */
    alt: number;
}
