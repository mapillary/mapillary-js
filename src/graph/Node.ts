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

    constructor (key: string, ca: number, latLon: ILatLon, worthy: boolean, sequence: Sequence, apiNavImIm: IAPINavImIm) {
        this.key = key;
        this.ca = ca;
        this.latLon = latLon;
        this.worthy = worthy;
        this.sequence = sequence;
        this.apiNavImIm = apiNavImIm;
    }

    public findNextKeyInSequence (): string {
        return this.sequence.findNextKey(this.key);
    }

    public findPrevKeyInSequence (): string {
        return this.sequence.findPrevKey(this.key);
    }

}

export default Node;
