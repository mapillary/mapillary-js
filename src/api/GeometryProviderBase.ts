import IGeometryProvider, { ICellNeighbors, ICellCorners } from "./interfaces/IGeometryProvider";
import ILatLon from "./interfaces/ILatLon";
import MapillaryError from "../error/MapillaryError";
import GeoCoords from "../geo/GeoCoords";

export class GeometryProviderBase implements IGeometryProvider {
    protected _geoCoords: GeoCoords;
    /**
     * Create a new geometry provider base instance.
     *
     * @ignore @param {GeoCoords} [geoCoords] - Optional geo coords instance.
     */
    constructor(geoCoords?: GeoCoords) {
        this._geoCoords = geoCoords != null ? geoCoords : new GeoCoords();
    }

    public getNeighbors(cellId: string): ICellNeighbors {
        throw new MapillaryError("Not implemented");
    }

    public getCorners(cellId: string): ICellCorners {
        throw new MapillaryError("Not implemented");
    }

    public bboxToCellIds(sw: ILatLon, ne: ILatLon): string[] {
        throw new MapillaryError("Not implemented");
    }

    public latLonToCellId(latLon: ILatLon, relativeLevel?: number): string {
        throw new MapillaryError("Not implemented");
    }

    public latLonToCellIds(latLon: ILatLon, threshold: number, relativeLevel?: number): string[] {
        throw new MapillaryError("Not implemented");
    }

    protected _bboxSquareToCellIds(sw: ILatLon, ne: ILatLon): string[] {
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

    protected _filterNeighbors(
        latLon: ILatLon,
        threshold: number,
        cellId: string,
        corners: ICellCorners,
        neighbors: ICellNeighbors): string[] {

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
}

export default GeometryProviderBase;
