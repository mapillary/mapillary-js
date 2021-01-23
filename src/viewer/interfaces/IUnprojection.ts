import { ILatLon } from "../../api/interfaces/ILatLon";

export interface IUnprojection {
    basicPoint: number[];
    latLon: ILatLon;
    pixelPoint: number[];
}
