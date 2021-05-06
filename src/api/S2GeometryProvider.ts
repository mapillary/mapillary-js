import { S2 } from "s2-geometry";

import { GeometryProviderBase } from "./GeometryProviderBase";
import { LngLat } from "./interfaces/LngLat";

/**
 * @class S2GeometryProvider
 *
 * @classdesc Geometry provider based on S2 cells.
 *
 * @example
 * ```js
 * class MyDataProvider extends DataProviderBase {
 *      ...
 * }
 *
 * const geometryProvider = new S2GeometryProvider();
 * const dataProvider = new MyDataProvider(geometryProvider);
 * ```
 */
export class S2GeometryProvider extends GeometryProviderBase {
    /**
     * Create a new S2 geometry provider instance.
     */
    constructor(private readonly _level: number = 17) { super(); }

    /** @inheritdoc */
    public bboxToCellIds(sw: LngLat, ne: LngLat): string[] {
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
    public getVertices(cellId: string): LngLat[] {
        const key = S2.idToKey(cellId);
        const cell = S2.S2Cell.FromHilbertQuadKey(key);
        return cell
            .getCornerLatLngs()
            .map(
                (c: S2.ILatLng): LngLat => {
                    return { lat: c.lat, lng: c.lng };
                });
    }

    /** @inheritdoc */
    public lngLatToCellId(lngLat: LngLat): string {
        return this._lngLatToId(lngLat, this._level);
    }

    private _getNeighbors(s2key: string, level: number): string[] {
        const latlng = S2.keyToLatLng(s2key);
        const neighbors = S2.latLngToNeighborKeys(
            latlng.lat,
            latlng.lng,
            level);

        return neighbors;
    }

    private _lngLatToId(lngLat: LngLat, level: number): string {
        const s2key = S2.latLngToKey(
            lngLat.lat,
            lngLat.lng,
            level);

        return S2.keyToId(s2key);
    }
}
