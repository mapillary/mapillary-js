import ILatLon from "./ILatLon";
import ICellCorners, { ICellNeighbors } from "./ICellCorners";

export interface IGeometryProvider {
    getNeighbors(cellId: string): ICellNeighbors;
    getCorners(cellId: string): ICellCorners;
    bboxToCellIds(sw: ILatLon, ne: ILatLon): string[];
    latLonToCellId(latLon: ILatLon, relativeLevel?: number): string;
    latLonToCellIds(latLon: ILatLon, threshold: number, relativeLevel?: number): string[];
}

export default IGeometryProvider;
