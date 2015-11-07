/* Interfaces */
import IAPINavImIm from "./IAPINavImIm";
import IAPINavImS from "./IAPINavImS";
import ILatLon from "./ILatLon";

export interface INode {
    key: string;
    ca: number;
    latLon: ILatLon;
    worthy: boolean;
    sequence: IAPINavImS;
    apiNavImIm: IAPINavImIm;
}

export default INode;
