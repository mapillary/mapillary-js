import { LatLon } from "../../api/interfaces/LatLon";

export interface Unprojection {
    basicPoint: number[];
    latLon: LatLon;
    pixelPoint: number[];
}
