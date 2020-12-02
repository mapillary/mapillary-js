import { S2 } from "s2-geometry";

import {
    ICellNeighbors,
    ICellCorners
} from "./interfaces/IGeometryProvider";
import ILatLon from "./interfaces/ILatLon";
import GeoCoords from "../geo/GeoCoords";
import GeometryProviderBase from "./GeometryProviderBase";

export class S2GeometryProvider extends GeometryProviderBase {
    private _level: number;

    /**
     * Create a new S2 geometry provider instance.
     *
     * @ignore @param {GeoCoords} [geoCoords] - Optional geo coords instance.
     */
    constructor(geoCoords?: GeoCoords) {
        super(geoCoords);

        this._level = 17;
    }

    public bboxToCellIds(sw: ILatLon, ne: ILatLon): string[] {
        return this._bboxSquareToCellIds(sw, ne);
    }

    public getNeighbors(cellId: string): ICellNeighbors {
        const key: string = S2.idToKey(cellId);
        const position: string = key.split('/')[1];
        const level: number = position.length;

        const [w, n, e, s]: string[] = this._getNeighbors(key, level);
        const [, nw, , sw]: string[] = this._getNeighbors(w, level);
        const [, ne, , se]: string[] = this._getNeighbors(e, level);

        return {
            e: S2.keyToId(e),
            n: S2.keyToId(n),
            ne: S2.keyToId(ne),
            nw: S2.keyToId(nw),
            s: S2.keyToId(s),
            se: S2.keyToId(se),
            sw: S2.keyToId(sw),
            w: S2.keyToId(w),
        };
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
        relativeLevel: number = 0): string[] {

        const key: string = S2.latLngToKey(
            latLon.lat,
            latLon.lon,
            this._level + relativeLevel);

        const cellId: string = S2.keyToId(key);
        const corners: ICellCorners = this.getCorners(cellId);
        const neighbors: ICellNeighbors = this.getNeighbors(cellId);

        return this._filterNeighbors(
            latLon,
            threshold,
            cellId,
            corners,
            neighbors);
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
