import { S2 } from "s2-geometry";

import IGeometryProvider, {
    ICellNeighbors,
    ICellCorners
} from "./interfaces/IGeometryProvider";
import ILatLon from "./interfaces/ILatLon";
import MapillaryError from "../error/MapillaryError";
import GeoCoords from "../geo/GeoCoords";

export class S2GeometryProvider implements IGeometryProvider {
    private _geoCoords: GeoCoords;
    private _level: number;

    /**
     * Create a new S2 geometry provider instance.
     *
     * @ignore @param {GeoCoords} [geoCoords] - Optional geo coords instance.
     */
    constructor(geoCoords?: GeoCoords) {
        this._geoCoords = geoCoords != null ? geoCoords : new GeoCoords();
        this._level = 15;
    }

    public bboxToCellIds(sw: ILatLon, ne: ILatLon): string[] {
        if (ne.lat <= sw.lat || ne.lon <= sw.lon) {
            throw new MapillaryError("North east needs to be top right of south west");
        }

        const centerLat: number = (sw.lat + ne.lat) / 2;
        const centerLon: number = (sw.lon + ne.lon) / 2;

        const enu: number[] =
            this._geoCoords.geodeticToEnu(
                ne.lat,
                ne.lon,
                0,
                centerLat,
                centerLon,
                0);

        const threshold: number = Math.max(enu[0], enu[1]);

        return this.latLonToCellIds(
            { lat: centerLat, lon: centerLon },
            threshold);
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

        const bl: number[] = [0, 0, 0];
        const tr: number[] =
            this._geoCoords.geodeticToEnu(
                corners.ne.lat,
                corners.ne.lon,
                0,
                corners.sw.lat,
                corners.sw.lon,
                0);

        const position: number[] =
            this._geoCoords.geodeticToEnu(
                latLon.lat,
                latLon.lon,
                0,
                corners.sw.lat,
                corners.sw.lon,
                0);

        const left: number = position[0] - bl[0];
        const right: number = tr[0] - position[0];
        const bottom: number = position[1] - bl[1];
        const top: number = tr[1] - position[1];

        const l: boolean = left < threshold;
        const r: boolean = right < threshold;
        const b: boolean = bottom < threshold;
        const t: boolean = top < threshold;

        const cellIds: string[] = [cellId];

        if (t) {
            cellIds.push(neighbors.n);
        }

        if (t && l) {
            cellIds.push(neighbors.nw);
        }

        if (l) {
            cellIds.push(neighbors.w);
        }

        if (l && b) {
            cellIds.push(neighbors.sw);
        }

        if (b) {
            cellIds.push(neighbors.s);
        }

        if (b && r) {
            cellIds.push(neighbors.se);
        }

        if (r) {
            cellIds.push(neighbors.e);
        }

        if (r && t) {
            cellIds.push(neighbors.ne);
        }

        return cellIds;
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
