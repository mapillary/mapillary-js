import * as THREE from "three";

import {
    GeoCoords,
    ILatLonAlt,
    Spatial,
} from "../Geo";

const geoCoords: GeoCoords = new GeoCoords();
const spatial: Spatial = new Spatial();

export function computeTranslation(position: ILatLonAlt, rotation: number[], reference: ILatLonAlt): number[] {
    const C: number[] = geoCoords.geodeticToEnu(
        position.lat,
        position.lon,
        position.alt,
        reference.lat,
        reference.lon,
        reference.alt);

    const RC: THREE.Vector3 = spatial.rotate(C, rotation);
    const translation: number[] = [-RC.x, -RC.y, -RC.z];

    return translation;
}
