import {Marker} from "../../../Component";

export interface ISpatialMarker {
    id: string;
    lat: number;
    lon: number;
    marker: Marker;
}

export default ISpatialMarker;
