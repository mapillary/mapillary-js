/* Interfaces */
import IAPINavImIm from "../../api/interfaces/IAPINavImIm";
import IAPINavImS from "../../api/interfaces/IAPINavImS";
import ILatLon from "../../viewer/interfaces/ILatLon";

export interface INode {
    key: string;
    ca: number;
    latLon: ILatLon;
    worthy: boolean;
    sequence: IAPINavImS;
    apiNavImIm: IAPINavImIm;
}

export default INode;
