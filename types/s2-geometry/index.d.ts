declare module "s2-geometry" {
    export module S2 {
        interface ILatLng {
            lat: number;
            lng: number;
        }

        function latLngToNeighborKeys(lat: number, lng: number, level: number): string[];

        function latLngToKey(lat: number, lng: number, level: number): string;
        function keyToId(key: string): string;

        function idToLatLng(id: string): ILatLng;
        function idToKey(id: string): string;
        function keyToLatLng(key: string): ILatLng;

        class S2Cell {
            static FromHilbertQuadKey(key: string): S2Cell;
            getCornerLatLngs(): ILatLng[];
        }
    }
}
