import * as geohash from "latlon-geohash";

import GeohashGeometryProvider from "../../src/api/GeohashGeometryProvider";
import GeoCoords from "../../src/geo/GeoCoords";
import MapillaryError from "../../src/error/MapillaryError";

describe("GeohashGeometryProvider.ctor", () => {
    it("should be defined", () => {
        const geometry: GeohashGeometryProvider = new GeohashGeometryProvider();

        expect(geometry).toBeDefined();
    });
});

describe("GeohashGeometryProvider.latLonToCellId", () => {
    it("should call encoder correctly", () => {
        const encodeSpy: jasmine.Spy = spyOn(geohash, "encode");
        encodeSpy.and.returnValue("0,0");

        const geometry: GeohashGeometryProvider = new GeohashGeometryProvider();

        const lat: number = -1;
        const lon: number = 1;

        geometry.latLonToCellId({ lat: -1, lon: 1 });

        expect(encodeSpy.calls.count()).toBe(1);
        expect(encodeSpy.calls.first().args[0]).toBe(lat);
        expect(encodeSpy.calls.first().args[1]).toBe(lon);
    });
});

describe("GeohashGeometryProvider.latLonToCellIds", () => {
    const setupSpies: (geoCoords: GeoCoords, tileSize: number) => void =
        (geoCoords: GeoCoords, tileSize: number): void => {
            spyOn(geohash, "encode").and.returnValue("0,0");
            spyOn(geohash, "bounds").and.returnValue({
                ne: { lat: 1, lon: 1 },
                sw: { lat: -1, lon: -1 },
            });
            spyOn(geohash, "neighbours").and.returnValue({
                e: "1,0",
                n: "0,1",
                ne: "1,1",
                nw: "-1,1",
                s: "0,-1",
                se: "1,-1",
                sw: "-1,-1",
                w: "-1,0",
            });

            spyOn(geoCoords, "geodeticToEnu").and.callFake(
                (lat: number, lon: number, alt: number, refLat: number, refLon: number): number[] => {
                    return [
                        tileSize / 2 * (lat - refLat),
                        tileSize / 2 * (lon - refLon),
                        0];
                });
        };

    it("should return h of position only", () => {
        const geoCoords: GeoCoords = new GeoCoords();
        const geometry: GeohashGeometryProvider = new GeohashGeometryProvider(geoCoords);

        const threshold: number = 20;
        const tileSize: number = 2 * (threshold + 1);

        setupSpies(geoCoords, tileSize);

        const hs: string[] = geometry.latLonToCellIds({ lat: 0, lon: 0 }, threshold);

        expect(hs.length).toBe(1);
        expect(hs[0]).toBe("0,0");
    });

    it("should return h of position and north neighbour", () => {
        const geoCoords: GeoCoords = new GeoCoords();
        const geometry: GeohashGeometryProvider = new GeohashGeometryProvider(geoCoords);

        const threshold: number = 20;
        const tileSize: number = 2 * (threshold + 1);

        setupSpies(geoCoords, tileSize);

        const hs: string[] = geometry.latLonToCellIds({ lat: 0, lon: 0.5 }, threshold);

        expect(hs.length).toBe(2);
        expect(hs.indexOf("0,0")).not.toBe(-1);
        expect(hs.indexOf("0,1")).not.toBe(-1);
    });

    it("should return h of position and east neighbour", () => {
        const geoCoords: GeoCoords = new GeoCoords();
        const geometry: GeohashGeometryProvider = new GeohashGeometryProvider(geoCoords);

        const threshold: number = 20;
        const tileSize: number = 2 * (threshold + 1);

        setupSpies(geoCoords, tileSize);

        const hs: string[] = geometry.latLonToCellIds({ lat: 0.5, lon: 0 }, threshold);

        expect(hs.length).toBe(2);
        expect(hs.indexOf("0,0")).not.toBe(-1);
        expect(hs.indexOf("1,0")).not.toBe(-1);
    });

    it("should return h of position and south neighbour", () => {
        const geoCoords: GeoCoords = new GeoCoords();
        const geometry: GeohashGeometryProvider = new GeohashGeometryProvider(geoCoords);

        const threshold: number = 20;
        const tileSize: number = 2 * (threshold + 1);

        setupSpies(geoCoords, tileSize);

        const hs: string[] = geometry.latLonToCellIds({ lat: 0, lon: -0.5 }, threshold);

        expect(hs.length).toBe(2);
        expect(hs.indexOf("0,0")).not.toBe(-1);
        expect(hs.indexOf("0,-1")).not.toBe(-1);
    });

    it("should return h of position and west neighbour", () => {
        const geoCoords: GeoCoords = new GeoCoords();
        const geometry: GeohashGeometryProvider = new GeohashGeometryProvider(geoCoords);

        const threshold: number = 20;
        const tileSize: number = 2 * (threshold + 1);

        setupSpies(geoCoords, tileSize);

        const hs: string[] = geometry.latLonToCellIds({ lat: -0.5, lon: 0 }, threshold);

        expect(hs.length).toBe(2);
        expect(hs.indexOf("0,0")).not.toBe(-1);
        expect(hs.indexOf("-1,0")).not.toBe(-1);
    });

    it("should return h of position and north east neighbours", () => {
        const geoCoords: GeoCoords = new GeoCoords();
        const geometry: GeohashGeometryProvider = new GeohashGeometryProvider(geoCoords);

        const threshold: number = 20;
        const tileSize: number = 2 * (threshold + 1);

        setupSpies(geoCoords, tileSize);

        const hs: string[] = geometry.latLonToCellIds({ lat: 0.5, lon: 0.5 }, threshold);

        expect(hs.length).toBe(4);
        expect(hs.indexOf("0,0")).not.toBe(-1);
        expect(hs.indexOf("0,1")).not.toBe(-1);
        expect(hs.indexOf("1,1")).not.toBe(-1);
        expect(hs.indexOf("1,0")).not.toBe(-1);
    });

    it("should return h of position and south east neighbours", () => {
        const geoCoords: GeoCoords = new GeoCoords();
        const geometry: GeohashGeometryProvider = new GeohashGeometryProvider(geoCoords);

        const threshold: number = 20;
        const tileSize: number = 2 * (threshold + 1);

        setupSpies(geoCoords, tileSize);

        const hs: string[] = geometry.latLonToCellIds({ lat: 0.5, lon: -0.5 }, threshold);

        expect(hs.length).toBe(4);
        expect(hs.indexOf("0,0")).not.toBe(-1);
        expect(hs.indexOf("1,0")).not.toBe(-1);
        expect(hs.indexOf("1,-1")).not.toBe(-1);
        expect(hs.indexOf("0,-1")).not.toBe(-1);
    });

    it("should return h of position and south west neighbours", () => {
        const geoCoords: GeoCoords = new GeoCoords();
        const geometry: GeohashGeometryProvider = new GeohashGeometryProvider(geoCoords);

        const threshold: number = 20;
        const tileSize: number = 2 * (threshold + 1);

        setupSpies(geoCoords, tileSize);

        const hs: string[] = geometry.latLonToCellIds({ lat: -0.5, lon: -0.5 }, threshold);

        expect(hs.length).toBe(4);
        expect(hs.indexOf("0,0")).not.toBe(-1);
        expect(hs.indexOf("0,-1")).not.toBe(-1);
        expect(hs.indexOf("-1,-1")).not.toBe(-1);
        expect(hs.indexOf("-1,0")).not.toBe(-1);
    });

    it("should return h of position and north west neighbours", () => {
        const geoCoords: GeoCoords = new GeoCoords();
        const geometry: GeohashGeometryProvider = new GeohashGeometryProvider(geoCoords);

        const threshold: number = 20;
        const tileSize: number = 2 * (threshold + 1);

        setupSpies(geoCoords, tileSize);

        const hs: string[] = geometry.latLonToCellIds({ lat: -0.5, lon: 0.5 }, threshold);

        expect(hs.length).toBe(4);
        expect(hs.indexOf("0,0")).not.toBe(-1);
        expect(hs.indexOf("-1,0")).not.toBe(-1);
        expect(hs.indexOf("-1,1")).not.toBe(-1);
        expect(hs.indexOf("0,1")).not.toBe(-1);
    });

    it("should return h of position and all neighbours", () => {
        const geoCoords: GeoCoords = new GeoCoords();
        const geometry: GeohashGeometryProvider = new GeohashGeometryProvider(geoCoords);

        const threshold: number = 20;
        const tileSize: number = 2 * (threshold - 1);

        setupSpies(geoCoords, tileSize);

        const hs: string[] = geometry.latLonToCellIds({ lat: 0, lon: 0 }, threshold);

        expect(hs.length).toBe(9);
        expect(hs.indexOf("0,0")).not.toBe(-1);
        expect(hs.indexOf("0,1")).not.toBe(-1);
        expect(hs.indexOf("-1,1")).not.toBe(-1);
        expect(hs.indexOf("-1,0")).not.toBe(-1);
        expect(hs.indexOf("-1,-1")).not.toBe(-1);
        expect(hs.indexOf("0,-1")).not.toBe(-1);
        expect(hs.indexOf("1,-1")).not.toBe(-1);
        expect(hs.indexOf("1,0")).not.toBe(-1);
        expect(hs.indexOf("1,1")).not.toBe(-1);
    });
});

describe("GeohashGeometryProvider.bboxToCellIds", () => {
    it("should throw if north east is not larger than south west", () => {
        const geometry: GeohashGeometryProvider = new GeohashGeometryProvider();

        expect(() => { geometry.bboxToCellIds({ lat: 0, lon: 0 }, { lat: -1, lon: 1 }); })
            .toThrowError(MapillaryError);
        expect(() => { geometry.bboxToCellIds({ lat: 0, lon: 0 }, { lat: 1, lon: -1 }); })
            .toThrowError(MapillaryError);
        expect(() => { geometry.bboxToCellIds({ lat: 0, lon: 0 }, { lat: -1, lon: -1 }); })
            .toThrowError(MapillaryError);
    });

    it("should call latLonToCellIds with center and correct threshold", () => {
        const geoCoords: GeoCoords = new GeoCoords();
        const geometry: GeohashGeometryProvider = new GeohashGeometryProvider(geoCoords);

        spyOn(geoCoords, "geodeticToEnu").and.returnValue([10, 20, 0]);
        const encodeHsSpy: jasmine.Spy = spyOn(geometry, "latLonToCellIds").and.stub();

        geometry.bboxToCellIds({ lat: 0, lon: 0 }, { lat: 1, lon: 3 });

        expect(encodeHsSpy.calls.count()).toBe(1);
        expect(encodeHsSpy.calls.argsFor(0)[0].lat).toBe(0.5);
        expect(encodeHsSpy.calls.argsFor(0)[0].lon).toBe(1.5);
    });
});
