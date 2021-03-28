import { LngLat } from "../../api/interfaces/LngLat";

export interface Unprojection {
    basicPoint: number[];
    lngLat: LngLat;
    pixelPoint: number[];
}
