import {ICurrentState} from "../../State";

export interface IFrame {
    id: number;
    fps: number;
    state: ICurrentState;
}

export default IFrame;
