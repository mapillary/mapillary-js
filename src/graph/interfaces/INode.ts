/* Interfaces */
import {IAPINavImIm, IAPINavImS} from "../../api/API";
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
