import { S2 } from "s2-geometry";

import { GeometryProviderBase } from "./GeometryProviderBase";
import { LatLon } from "./interfaces/LatLon";

/**
 * @class S2GeometryProvider
 *
 * @classdesc Geometry provider based on S2 cells.
 *
 * @example
 * ```js
 * class MyDataProvider extends mapillary.API.DataProviderBase {
 *      ...
 * }
 *
 * const s2GeometryProvider = new mapillary.API.S2GeometryProvider();
 * const myDataProvider = new MyDataProvider(s2GeometryProvider);
 * ```
 */
export class S2GeometryProvider extends GeometryProviderBase {
    /**
     * Create a new S2 geometry provider instance.
     */
    constructor(private readonly _level: number = 17) { super(); }

    /** @inheritdoc */
    public bboxToCellIds(sw: LatLon, ne: LatLon): string[] {
        return this._approxBboxToCellIds(sw, ne);
    }

    /** @inheritdoc */
    public getAdjacent(cellId: string): string[] {
        const k = S2.idToKey(cellId);
        const position = k.split('/')[1];
        const level = position.length;

        const [a0, a1, a2, a3] = this._getNeighbors(k, level);
        const existing = [k, a0, a1, a2, a3];
        const others = Array
            .from(
                new Set([
                    ...this._getNeighbors(a0, level),
                    ...this._getNeighbors(a1, level),
                    ...this._getNeighbors(a2, level),
                    ...this._getNeighbors(a3, level),
                ].filter(
                    (o: string): boolean => {
                        return !existing.includes(o);
                    })));

        const adjacent = [a0, a1, a2, a3];
        for (const other of others) {
            let count = 0;
            for (const n of this._getNeighbors(other, level)) {
                if (existing.includes(n)) { count++; }
            }
            if (count === 2) { adjacent.push(other); }
        }
        return adjacent.map((a: string): string => S2.keyToId(a));
    }

    /** @inheritdoc */
    public getVertices(cellId: string): LatLon[] {
        const key = S2.idToKey(cellId);
        const cell = S2.S2Cell.FromHilbertQuadKey(key);
        return cell
            .getCornerLatLngs()
            .map(
                (c: S2.ILatLng): LatLon => {
                    return { lat: c.lat, lon: c.lng };
                });
    }

    /** @inheritdoc */
    public latLonToCellId(latLon: LatLon): string {
        return this._latLonToId(latLon, this._level);
    }

    private _getNeighbors(s2key: string, level: number): string[] {
        const latlng = S2.keyToLatLng(s2key);
        const neighbors = S2.latLngToNeighborKeys(
            latlng.lat,
            latlng.lng,
            level);

        return neighbors;
    }

    private _latLonToId(latLon: LatLon, level: number): string {
        const s2key = S2.latLngToKey(
            latLon.lat,
            latLon.lon,
            level);

        return S2.keyToId(s2key);
    }
}
