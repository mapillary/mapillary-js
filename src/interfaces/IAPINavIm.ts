/* Interfaces */
import IStringArray from "./IStringArray";
import IAPINavImImArray from "./IAPINavImImArray";
import IAPINavImSArray from "./IAPINavImSArray";

export interface IAPINavIm {
    hs: IStringArray;
    ims: IAPINavImImArray;
    ss: IAPINavImSArray;
}

export default IAPINavIm;
