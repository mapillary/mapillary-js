/// <reference path="../../typings/index.d.ts" />

import {WebMercator, ITile, IBBox, ILatLon, Spatial} from "../../src/Geo";

describe("WebMercator.getTile", () => {
    let webMercator: WebMercator;
    let spatial: Spatial;

    beforeEach(() => {
        webMercator = new WebMercator();
        spatial = new Spatial();
    });

    it("should have the same zoom as the provided value", () => {
        let latLon: ILatLon = { lat: 0, lon: 0 };

        let zoom0: number = 0;
        let tile0: ITile = webMercator.getTile(latLon, zoom0);
        expect(tile0.z).toBe(zoom0);

        let zoom1: number = 1;
        let tile1: ITile = webMercator.getTile(latLon, zoom1);
        expect(tile1.z).toBe(zoom1);

        let zoom10: number = 10;
        let tile10: ITile = webMercator.getTile(latLon, zoom10);
        expect(tile10.z).toBe(zoom10);
    });

    it("should get the tile at origin when zoom level is zero", () => {
        let latLon: ILatLon = { lat: 0, lon: 0 };
        let zoom: number = 0;

        let tile: ITile = webMercator.getTile(latLon, zoom);

        expect(tile.x).toBe(0);
        expect(tile.y).toBe(0);
        expect(tile.z).toBe(0);
    });

    it("should get the tile at origin when zoom level is zero for all coordinates", () => {
        let latLon1: ILatLon = { lat: 85, lon: -175 };
        let zoom: number = 0;

        let tile1: ITile = webMercator.getTile(latLon1, zoom);

        expect(tile1.x).toBe(0);
        expect(tile1.y).toBe(0);
        expect(tile1.z).toBe(0);

        let latLon2: ILatLon = { lat: -85, lon: 175 };

        let tile2: ITile = webMercator.getTile(latLon2, zoom);

        expect(tile2.x).toBe(0);
        expect(tile2.y).toBe(0);
        expect(tile2.z).toBe(0);
    });

    it("should get the four different tiles at zoom level 1", () => {
        let setup: any = [
            { lat: 45, lon: -90, x: 0, y: 0 },
            { lat: -45, lon: -90, x: 0, y: 1 },
            { lat: 45, lon: 90, x: 1, y: 0 },
            { lat: -45, lon: 90, x: 1, y: 1 },
        ];

        let zoom: number = 1;

        for (let item of setup) {
            let tile: ITile = webMercator.getTile({ lat: item.lat, lon: item.lon }, zoom);

            expect(tile.x).toBe(item.x);
            expect(tile.y).toBe(item.y);
            expect(tile.z).toBe(zoom);
        }
    });

    it("should get the sixteen different tiles at zoom level 2", () => {
        let zoom: number = 2;
        let setup: any = [];

        for (let i: number = 0; i < Math.pow(2, zoom); i++) {
             for (let j: number = 0; j < Math.pow(2, zoom); j++) {
                let lat: number = 67.5 - 180 * i / 4;
                let lon: number = -135 + 360 * j / 4;
                let x: number = j;
                let y: number = i;

                setup.push({ lat: lat, lon: lon, x: x, y: y });
             }
        }

        for (let item of setup) {
            let tile: ITile = webMercator.getTile({ lat: item.lat, lon: item.lon }, zoom);

            expect(tile.x).toBe(item.x);
            expect(tile.y).toBe(item.y);
            expect(tile.z).toBe(zoom);
        }
    });

    it("should get the center tile for zero lat lon at all zoom levels", () => {
        let latLon: ILatLon = { lat: 0, lon: 0 };

        for (let zoom: number = 1; zoom <= 25; zoom++) {
            let tiles: number = Math.pow(2, zoom);
            let middleTile: number = tiles / 2;

            let tile: ITile = webMercator.getTile(latLon, zoom);

            expect(tile.x).toBe(middleTile);
            expect(tile.y).toBe(middleTile);
            expect(tile.z).toBe(zoom);
        }
    });
});

describe("WebMercator.getBounds", () => {
    let webMercator: WebMercator;
    let spatial: Spatial;

    let precision: number = 8;

    beforeEach(() => {
        webMercator = new WebMercator();
        spatial = new Spatial();
    });

    it("should get the bounds for zoom level 0", () => {
        let tile: ITile = { x: 0, y: 0, z: 0 };

        let bounds: IBBox = webMercator.getBounds(tile);

        let latitudeMax: number = spatial.radToDeg(2 * Math.atan(Math.exp(Math.PI)) - Math.PI / 2);

        expect(bounds.sw.lat).toBeCloseTo(-latitudeMax, precision);
        expect(bounds.sw.lon).toBe(-180);
        expect(bounds.ne.lat).toBeCloseTo(latitudeMax, precision);
        expect(bounds.ne.lon).toBe(180);
    });

    it("should get the bounds for zoom level 1", () => {
        let zoom: number = 1;

        let latitudeMax: number = spatial.radToDeg(2 * Math.atan(Math.exp(Math.PI)) - Math.PI / 2);

        let setup: any = [];

        for (let x: number = 0; x <= 1; x++) {
            for (let y: number = 0; y <= 1; y++) {
                let swLat: number = -latitudeMax * y;
                let swLon: number = 180 * (x - 1);
                let neLat: number = latitudeMax * (1 - y);
                let neLon: number = 180 * x;

                setup.push({ swLat: swLat, swLon: swLon, neLat: neLat, neLon: neLon, x: x, y: y });
            }
        }

        for (let item of setup) {
            let tile: ITile = { x: item.x, y: item.y, z: zoom };

            let bounds: IBBox = webMercator.getBounds(tile);

            expect(bounds.sw.lat).toBeCloseTo(item.swLat, precision);
            expect(bounds.sw.lon).toBe(item.swLon);
            expect(bounds.ne.lat).toBeCloseTo(item.neLat, precision);
            expect(bounds.ne.lon).toBe(item.neLon);
        }
    });
});
