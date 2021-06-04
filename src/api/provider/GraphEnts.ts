import { IDEnt } from "../ents/IDEnt";
import { SpatialImageEnt } from "../ents/SpatialImageEnt";
import { URLEnt } from "../ents/URLEnt";

export interface GraphGeometry { coordinates: [number, number]; }

export interface GraphCoreImageEnt extends IDEnt {
    computed_geometry: GraphGeometry;
    geometry: GraphGeometry;
    sequence: string;
}

export interface GraphSpatialImageEnt extends SpatialImageEnt {
    merge_cc: number;
    sfm_cluster: URLEnt;
    thumb_1024_url: string;
    thumb_2048_url: string;
}

export interface GraphImageEnt extends
    GraphCoreImageEnt,
    GraphSpatialImageEnt { }
