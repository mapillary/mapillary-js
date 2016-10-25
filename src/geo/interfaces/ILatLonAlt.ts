import {ILatLon} from "../../API";

export interface ILatLonAlt extends ILatLon {
    alt: number;
}

export default ILatLonAlt;
