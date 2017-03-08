import {ILatLon} from "../../API";

export interface IUnprojection {
    basicPoint: number[];
    latLon: ILatLon;
    pixelPoint: number[];
}

export default IUnprojection;
