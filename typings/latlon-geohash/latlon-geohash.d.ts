declare module "latlon-geohash" {
    export interface ILatLon {
        lat: number;
        lon: number;
    }

    export interface IBounds {
        sw: ILatLon;
        ne: ILatLon;
    }

    export function neighbours(hash: string): {[key: string]: string};
    export function encode(lat: number, lon: number, precision: number): string;
    export function bounds(hash: string): IBounds;
}