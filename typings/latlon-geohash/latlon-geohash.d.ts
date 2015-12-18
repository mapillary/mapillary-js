declare module "latlon-geohash" {
    export function neighbours(hash: string): {[key: string]: string};
}