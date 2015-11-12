import {IAPINavImIm} from "../API";
import {ILatLon} from "../Viewer";
import Sequence from "./Sequence";

export class Node {
    public key: string;
    public ca: number;
    public latLon: ILatLon;
    public worthy: boolean;
    public sequence: Sequence;
    public apiNavImIm: IAPINavImIm;
}

export default Node;
