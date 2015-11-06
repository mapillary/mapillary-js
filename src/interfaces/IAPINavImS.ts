/* Interfaces */
import IStringArray from "./IStringArray";

export interface IAPINavImS {
    starred: boolean;
    key: string;
    keys: IStringArray;
    path: any;
}

export default IAPINavImS;
