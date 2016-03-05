import {IGoogleTile, IPoint, IBBox} from "../Geo";
import {ILatLon} from "../Graph";

export class GoogleTiles {
    public fromLatLonToPoint(latLon: ILatLon): IPoint {
        let siny: number = Math.min(Math.max(Math.sin(latLon.lat * (Math.PI / 180)), -.9999), .9999);

        return {
            x: 128 + latLon.lon * (256 / 360),
            y: 128 + 0.5 * Math.log((1 + siny) / (1 - siny)) * -(256 / (2 * Math.PI)),
        };
    }

    public fromPointToLatLon(point: IPoint): ILatLon {
        return {
            lat: (2 * Math.atan(Math.exp((point.y - 128) / -(256 / (2 * Math.PI)))) - Math.PI / 2) / (Math.PI / 180),
            lon: (point.x - 128) / (256 / 360),
        };
    }

    public getTileAtLatLon(latLon: ILatLon, zoom: number): IGoogleTile {
        let t: number = Math.pow(2, zoom);
        let s: number = 256 / t;
        let p: IPoint = this.fromLatLonToPoint(latLon);

        return {
            x: Math.floor(p.x / s),
            y: Math.floor(p.y / s),
            z: zoom,
        };
    }

    public getTileBounds(tile: IGoogleTile): IBBox {
        tile = this.normalizeTile(tile);
        let t: number = Math.pow(2, tile.z);
        let s: number = 256 / t;

        let sw: IPoint = {
            x: tile.x * s,
            y: (tile.y * s) + s,
        };

        let ne: IPoint = {
            x: tile.x * s + s,
            y: (tile.y * s),
        };

        return {
            ne: this.fromPointToLatLon(ne),
            sw: this.fromPointToLatLon(sw),
        };
    }

    public normalizeTile(tile: IGoogleTile): IGoogleTile {
        let t: number = Math.pow(2, tile.z);

        tile.x = ((tile.x % t) + t) % t;
        tile.y = ((tile.y % t) + t) % t;

        return tile;
    }
}

export default GoogleTiles;
