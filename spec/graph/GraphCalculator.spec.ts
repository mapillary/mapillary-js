import * as geohash from "latlon-geohash";

import {ILatLon} from "../../src/API";
import {GraphMapillaryError} from "../../src/Error";
import {GeoCoords} from "../../src/Geo";
import {GraphCalculator} from "../../src/Graph";

describe("GraphCalculator.ctor", () => {
    it("should be defined", () => {
        let calculator: GraphCalculator = new GraphCalculator();

        expect(calculator).toBeDefined();
    });
});

describe("GraphCalculator.encodeH", () => {
    it("should call encoder correclty", () => {
        let encodeSpy: jasmine.Spy = spyOn(geohash, "encode");
        encodeSpy.and.returnValue("0,0");

        let calculator: GraphCalculator = new GraphCalculator();

        let lat: number = -1;
        let lon: number = 1;
        let precision: number = 7;

        calculator.encodeH({ lat: -1, lon: 1 }, precision);

        expect(encodeSpy.calls.count()).toBe(1);
        expect(encodeSpy.calls.first().args[0]).toBe(lat);
        expect(encodeSpy.calls.first().args[1]).toBe(lon);
        expect(encodeSpy.calls.first().args[2]).toBe(precision);
    });
});

describe("GraphCalculator.encodeHs", () => {
    let setupSpies: (geoCoords: GeoCoords, tileSize: number) => void =
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
                (lat: number, lon: number, alt: number, refLat: number, refLon: number, refAlt: number): number[] => {
                    return [
                        tileSize / 2 * (lat - refLat),
                        tileSize / 2 * (lon - refLon),
                        0];
                });
        };

    it("should return h of position only", () => {
        let geoCoords: GeoCoords = new GeoCoords();
        let calculator: GraphCalculator = new GraphCalculator(geoCoords);

        let threshold: number = 20;
        let tileSize: number = 2 * (threshold + 1);

        setupSpies(geoCoords, tileSize);

        let hs: string[] = calculator.encodeHs({ lat: 0, lon: 0 }, 7, threshold);

        expect(hs.length).toBe(1);
        expect(hs[0]).toBe("0,0");
    });

    it("should return h of position and north neighbour", () => {
        let geoCoords: GeoCoords = new GeoCoords();
        let calculator: GraphCalculator = new GraphCalculator(geoCoords);

        let threshold: number = 20;
        let tileSize: number = 2 * (threshold + 1);

        setupSpies(geoCoords, tileSize);

        let hs: string[] = calculator.encodeHs({ lat: 0, lon: 0.5 }, 7, threshold);

        expect(hs.length).toBe(2);
        expect(hs.indexOf("0,0")).not.toBe(-1);
        expect(hs.indexOf("0,1")).not.toBe(-1);
    });

    it("should return h of position and east neighbour", () => {
        let geoCoords: GeoCoords = new GeoCoords();
        let calculator: GraphCalculator = new GraphCalculator(geoCoords);

        let threshold: number = 20;
        let tileSize: number = 2 * (threshold + 1);

        setupSpies(geoCoords, tileSize);

        let hs: string[] = calculator.encodeHs({ lat: 0.5, lon: 0 }, 7, threshold);

        expect(hs.length).toBe(2);
        expect(hs.indexOf("0,0")).not.toBe(-1);
        expect(hs.indexOf("1,0")).not.toBe(-1);
    });

    it("should return h of position and south neighbour", () => {
        let geoCoords: GeoCoords = new GeoCoords();
        let calculator: GraphCalculator = new GraphCalculator(geoCoords);

        let threshold: number = 20;
        let tileSize: number = 2 * (threshold + 1);

        setupSpies(geoCoords, tileSize);

        let hs: string[] = calculator.encodeHs({ lat: 0, lon: -0.5 }, 7, threshold);

        expect(hs.length).toBe(2);
        expect(hs.indexOf("0,0")).not.toBe(-1);
        expect(hs.indexOf("0,-1")).not.toBe(-1);
    });

    it("should return h of position and west neighbour", () => {
        let geoCoords: GeoCoords = new GeoCoords();
        let calculator: GraphCalculator = new GraphCalculator(geoCoords);

        let threshold: number = 20;
        let tileSize: number = 2 * (threshold + 1);

        setupSpies(geoCoords, tileSize);

        let hs: string[] = calculator.encodeHs({ lat: -0.5, lon: 0 }, 7, threshold);

        expect(hs.length).toBe(2);
        expect(hs.indexOf("0,0")).not.toBe(-1);
        expect(hs.indexOf("-1,0")).not.toBe(-1);
    });

    it("should return h of position and north east neighbours", () => {
        let geoCoords: GeoCoords = new GeoCoords();
        let calculator: GraphCalculator = new GraphCalculator(geoCoords);

        let threshold: number = 20;
        let tileSize: number = 2 * (threshold + 1);

        setupSpies(geoCoords, tileSize);

        let hs: string[] = calculator.encodeHs({ lat: 0.5, lon: 0.5 }, 7, threshold);

        expect(hs.length).toBe(4);
        expect(hs.indexOf("0,0")).not.toBe(-1);
        expect(hs.indexOf("0,1")).not.toBe(-1);
        expect(hs.indexOf("1,1")).not.toBe(-1);
        expect(hs.indexOf("1,0")).not.toBe(-1);
    });

    it("should return h of position and south east neighbours", () => {
        let geoCoords: GeoCoords = new GeoCoords();
        let calculator: GraphCalculator = new GraphCalculator(geoCoords);

        let threshold: number = 20;
        let tileSize: number = 2 * (threshold + 1);

        setupSpies(geoCoords, tileSize);

        let hs: string[] = calculator.encodeHs({ lat: 0.5, lon: -0.5 }, 7, threshold);

        expect(hs.length).toBe(4);
        expect(hs.indexOf("0,0")).not.toBe(-1);
        expect(hs.indexOf("1,0")).not.toBe(-1);
        expect(hs.indexOf("1,-1")).not.toBe(-1);
        expect(hs.indexOf("0,-1")).not.toBe(-1);
    });

    it("should return h of position and south west neighbours", () => {
        let geoCoords: GeoCoords = new GeoCoords();
        let calculator: GraphCalculator = new GraphCalculator(geoCoords);

        let threshold: number = 20;
        let tileSize: number = 2 * (threshold + 1);

        setupSpies(geoCoords, tileSize);

        let hs: string[] = calculator.encodeHs({ lat: -0.5, lon: -0.5 }, 7, threshold);

        expect(hs.length).toBe(4);
        expect(hs.indexOf("0,0")).not.toBe(-1);
        expect(hs.indexOf("0,-1")).not.toBe(-1);
        expect(hs.indexOf("-1,-1")).not.toBe(-1);
        expect(hs.indexOf("-1,0")).not.toBe(-1);
    });

    it("should return h of position and north west neighbours", () => {
        let geoCoords: GeoCoords = new GeoCoords();
        let calculator: GraphCalculator = new GraphCalculator(geoCoords);

        let threshold: number = 20;
        let tileSize: number = 2 * (threshold + 1);

        setupSpies(geoCoords, tileSize);

        let hs: string[] = calculator.encodeHs({ lat: -0.5, lon: 0.5 }, 7, threshold);

        expect(hs.length).toBe(4);
        expect(hs.indexOf("0,0")).not.toBe(-1);
        expect(hs.indexOf("-1,0")).not.toBe(-1);
        expect(hs.indexOf("-1,1")).not.toBe(-1);
        expect(hs.indexOf("0,1")).not.toBe(-1);
    });

    it("should return h of position and all neighbours", () => {
        let geoCoords: GeoCoords = new GeoCoords();
        let calculator: GraphCalculator = new GraphCalculator(geoCoords);

        let threshold: number = 20;
        let tileSize: number = 2 * (threshold - 1);

        setupSpies(geoCoords, tileSize);

        let hs: string[] = calculator.encodeHs({ lat: 0, lon: 0 }, 7, threshold);

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

describe("GraphCalculator.boundingBoxCorners", () => {
    it("should return sw and ne in correct order", () => {
        let geoCoords: GeoCoords = new GeoCoords();

        spyOn(geoCoords, "enuToGeodetic").and.callFake(
            (x: number, y: number, z: number, refLat: number, refLon: number, refAlt: number): number[] => {
                return [refLat + x, refLon + y, refAlt + z];
            });

        let calculator: GraphCalculator = new GraphCalculator(geoCoords);

        let threshold: number = 1;
        let bbox: [ILatLon, ILatLon] = calculator.boundingBoxCorners({ lat: 0, lon: 0 }, threshold);

        expect(bbox.length).toBe(2);
        expect(bbox[0].lat).toBe(-1);
        expect(bbox[0].lon).toBe(-1);
        expect(bbox[1].lat).toBe(1);
        expect(bbox[1].lon).toBe(1);
    });
});

describe("GraphCalculator.encodeHsFromBoundingBox", () => {
    it("should throw if north east is not larger than south west", () => {
        let calculator: GraphCalculator = new GraphCalculator();

        expect(() => { calculator.encodeHsFromBoundingBox({ lat: 0, lon: 0 }, { lat: -1, lon: 1}); })
            .toThrowError(GraphMapillaryError);
        expect(() => { calculator.encodeHsFromBoundingBox({ lat: 0, lon: 0 }, { lat: 1, lon: -1}); })
            .toThrowError(GraphMapillaryError);
        expect(() => { calculator.encodeHsFromBoundingBox({ lat: 0, lon: 0 }, { lat: -1, lon: -1}); })
            .toThrowError(GraphMapillaryError);
    });

    it("should call encodeHs with center and correct threshold", () => {
        let geoCoords: GeoCoords = new GeoCoords();
        let calculator: GraphCalculator = new GraphCalculator(geoCoords);

        spyOn(geoCoords, "geodeticToEnu").and.returnValue([10, 20, 0]);
        const encodeHsSpy: jasmine.Spy = spyOn(calculator, "encodeHs").and.stub();

        calculator.encodeHsFromBoundingBox({ lat: 0, lon: 0 }, { lat: 1, lon: 2});

        expect(encodeHsSpy.calls.count()).toBe(1);
        expect(encodeHsSpy.calls.argsFor(0)[0].lat).toBe(0.5);
        expect(encodeHsSpy.calls.argsFor(0)[0].lon).toBe(1);
        expect(encodeHsSpy.calls.argsFor(0)[2]).toBe(20);
    });
});
