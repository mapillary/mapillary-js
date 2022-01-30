import { LngLatAlt } from "../../api/interfaces/LngLatAlt";
import { enuToGeodetic, geodeticToEnu } from "../../geo/GeoCoords";

export function resetEnu(reference: LngLatAlt, prevEnu: number[], prevReference: LngLatAlt): number[] {
    const [prevX, prevY, prevZ] = prevEnu;
    const [lng, lat, alt] = enuToGeodetic(
        prevX,
        prevY,
        prevZ,
        prevReference.lng,
        prevReference.lat,
        prevReference.alt);

    return geodeticToEnu(
        lng,
        lat,
        alt,
        reference.lng,
        reference.lat,
        reference.alt);
}
