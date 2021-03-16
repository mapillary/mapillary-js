import { LatLonEnt } from "../../api/ents/LatLonEnt";

export interface Unprojection {
    basicPoint: number[];
    latLon: LatLonEnt;
    pixelPoint: number[];
}
