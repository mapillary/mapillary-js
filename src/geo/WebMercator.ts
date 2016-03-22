import {ITile, IPoint, IBBox, Spatial} from "../Geo";
import {ILatLon} from "../Graph";

export class WebMercator {
    private _spatial: Spatial;
    private _tileSize: number;

    constructor() {
        this._spatial = new Spatial();
        this._tileSize = 256;
    }

    public getTile(latLon: ILatLon, zoom: number): ITile {
        let scale: number = Math.pow(2, zoom);
        let point: IPoint = this._latLonToPoint(latLon);

        return {
            x: Math.floor(scale * point.x / this._tileSize),
            y: Math.floor(scale * point.y / this._tileSize),
            z: zoom,
        };
    }

    public getBounds(tile: ITile): IBBox {
        tile = this._normalize(tile);

        let scale: number = Math.pow(2, tile.z);
        let s: number = this._tileSize / scale;

        let sw: IPoint = {
            x: tile.x * s,
            y: tile.y * s + s,
        };

        let ne: IPoint = {
            x: tile.x * s + s,
            y: tile.y * s,
        };

        return {
            ne: this._pointToLatLon(ne),
            sw: this._pointToLatLon(sw),
        };
    }

    private _normalize(tile: ITile): ITile {
        let scale: number = Math.pow(2, tile.z);

        tile.x = ((tile.x % scale) + scale) % scale;
        tile.y = ((tile.y % scale) + scale) % scale;

        return tile;
    }

    private _latLonToPoint(latLon: ILatLon): IPoint {
        let siny: number = Math.sin(this._spatial.degToRad(latLon.lat));

        return {
            x: this._tileSize * (0.5 + latLon.lon / 360),
            y: this._tileSize * (0.5 - Math.log((1 + siny) / (1 - siny)) / (4 * Math.PI)),
        };
    }

    private _pointToLatLon(point: IPoint): ILatLon {
        return {
            lat: this._spatial.radToDeg(2 * Math.atan(Math.exp(2 * Math.PI * (0.5 - point.y / this._tileSize)))) - 90,
            lon: 360 * (point.x / this._tileSize - 0.5),
        };
    }
}

export default WebMercator;
