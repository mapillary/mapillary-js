/* Interfaces */
import IAPINavImIm from "./IAPINavImIm";
import IAPINavImS from "./IAPINavImS";

export interface IAPINavIm {
    hs: string[];
    ims: IAPINavImIm[];
    ss: IAPINavImS[];
}

export default IAPINavIm;
