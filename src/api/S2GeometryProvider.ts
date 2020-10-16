import { S2 } from "s2-geometry";

import IGeometryProvider, {
    ICellNeighbors,
    ICellCorners
} from "./interfaces/IGeometryProvider";
import ILatLon from "./interfaces/ILatLon";

export class S2GeometryProvider implements IGeometryProvider {
    private _level: number;

    /**
     * Create a new S2 geometry provider instance.
     */
    constructor() {
        this._level = 15;
    }

    public getNeighbors(cellId: string): ICellNeighbors {
        const key: string = S2.idToKey(cellId);
        const position: string = key.split('/')[1];
        const level: number = position.length;

        const [w, s, e, n]: string[] = this._getNeighbors(key, level);
        const [, sw, , nw]: string[] = this._getNeighbors(w, level);
        const [, se, , ne]: string[] = this._getNeighbors(e, level);

        return { e, n, ne, nw, s, se, sw, w };
    }

    public getCorners(cellId: string): ICellCorners {
        const key: string = S2.idToKey(cellId);
        const cell: S2.S2Cell = S2.S2Cell.FromHilbertQuadKey(key);
        const [nw, ne, se, sw]: S2.ILatLng[] = cell.getCornerLatLngs();

        return {
            ne: { lat: ne.lat, lon: ne.lng },
            nw: { lat: nw.lat, lon: nw.lng },
            se: { lat: se.lat, lon: se.lng },
            sw: { lat: sw.lat, lon: sw.lng },
        };
    }

    public bboxToCellIds(sw: ILatLon, ne: ILatLon): string[] {
        throw new Error("Method not implemented.");
    }

    public latLonToCellId(
        latLon: ILatLon,
        relativeLevel: number = 0): string {

        const key: string = S2.latLngToKey(
            latLon.lat,
            latLon.lon,
            this._level + relativeLevel);

        return S2.keyToId(key);
    }

    public latLonToCellIds(
        latLon: ILatLon,
        threshold: number,
        relativeLevel?: number): string[] {

        throw new Error("Method not implemented.");
    }

    private _getNeighbors(key: string, level: number): string[] {
        const latlng: S2.ILatLng = S2.keyToLatLng(key);
        const neighbors: string[] = S2.latLngToNeighborKeys(
            latlng.lat,
            latlng.lng,
            level);

        return neighbors;
    }
}

export default S2GeometryProvider;
