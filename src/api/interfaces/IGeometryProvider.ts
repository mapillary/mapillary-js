import { ICellCorners, ICellNeighbors } from "./ICellCorners";
import { ILatLon } from "./ILatLon";

export interface IGeometryProvider {
    getNeighbors(cellId: string): ICellNeighbors;
    getCorners(cellId: string): ICellCorners;
    bboxToCellIds(sw: ILatLon, ne: ILatLon): string[];
    latLonToCellId(latLon: ILatLon, relativeLevel?: number): string;
    latLonToCellIds(latLon: ILatLon, threshold: number, relativeLevel?: number): string[];
}
