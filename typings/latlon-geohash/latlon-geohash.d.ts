declare module "latlon-geohash" {
    export function neighbours(hash: string): {[key: string]: string};
    export function encode(lat: number, lon: number, precision: number): string;
}