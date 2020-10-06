/**
 * Interface that represents a latitude-longitude coordinate,
 * measured in degrees and an altitude in meters.
 * Coordinates are defined in the WGS84 datum.
 *
 * @interface IGeoReference
 */
export interface IGeoReference {
    altitude: number;
    latitude: number;
    longitude: number;
}

export default IGeoReference;
