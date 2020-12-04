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

    public bboxToCellIds(sw: ILatLon, ne: ILatLon): string[] {
        throw new MapillaryError("Not implemented");
    }

    public getCorners(cellId: string): ICellCorners {
        throw new MapillaryError("Not implemented");
    }

    public getNeighbors(cellId: string): ICellNeighbors {
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
}

export default GeometryProviderBase;
