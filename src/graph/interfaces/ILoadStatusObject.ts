import {ILoadStatus} from "../../Graph";

export interface ILoadStatusObject<T> {
    loaded: ILoadStatus;
    object: T;
}

export default ILoadStatusObject;
