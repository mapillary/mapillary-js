import {ISimpleMarkerStyle} from "./ISimpleMarkerStyle";
import {ITrafficSignMarkerStyle} from "./ITrafficSignMarkerStyle";

export interface IMarkerOptions {
    id: string;
    type: string;
    style: ISimpleMarkerStyle | ITrafficSignMarkerStyle;
}

export default IMarkerOptions;
