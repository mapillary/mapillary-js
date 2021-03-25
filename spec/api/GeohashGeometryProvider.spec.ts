import * as geohash from "latlon-geohash";
import { GeohashGeometryProvider } from "../../src/api/GeohashGeometryProvider";
import { MapillaryError } from "../../src/error/MapillaryError";
import * as GeoCoords from "../../src/geo/GeoCoords";

jest.mock("latlon-geohash");
const mockedGeohash = geohash as jest.Mocked<typeof geohash>;

describe("GeohashGeometryProvider.ctor", () => {
    test("should be defined", () => {
        const geometry = new GeohashGeometryProvider();

        expect(geometry).toBeDefined();
    });
});

describe("GeohashGeometryProvider.latLonToCellId", () => {
    beforeEach(() => { mockedGeohash.encode.mockClear(); });

    test("should call encoder correctly", () => {
        const mockEncode = mockedGeohash.encode.mockReturnValueOnce("0,0");

        const level = 7;
        const geometry = new GeohashGeometryProvider();

        const lat: number = -1;
        const lon: number = 1;

        geometry.latLonToCellId({ lat: -1, lon: 1 });

        expect(mockEncode).toHaveBeenCalledTimes(1);
        expect(mockEncode).toHaveBeenCalledWith(lat, lon, level);
    });
});

describe("GeohashGeometryProvider.latLonToCellIds", () => {
    const setupSpies: (tileSize: number) => void =
        (tileSize: number): void => {
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

            spyOn(GeoCoords, "geodeticToEnu").and.callFake(
                (lat: number, lon: number, alt: number, refLat: number, refLon: number): number[] => {
                    return [
                        tileSize / 2 * (lat - refLat),
                        tileSize / 2 * (lon - refLon),
                        0];
                });
        };

    test("should return h of position only", () => {
        const geometry = new GeohashGeometryProvider();

        const threshold: number = 20;
        const tileSize: number = 2 * (threshold + 1);

        setupSpies(tileSize);

        const hs: string[] = geometry.latLonToCellIds({ lat: 0, lon: 0 }, threshold);

        expect(hs.length).toBe(1);
        expect(hs[0]).toBe("0,0");
    });

    test("should return h of position and north neighbour", () => {
        const geometry = new GeohashGeometryProvider();

        const threshold: number = 20;
        const tileSize: number = 2 * (threshold + 1);

        setupSpies(tileSize);

        const hs: string[] = geometry.latLonToCellIds({ lat: 0, lon: 0.5 }, threshold);

        expect(hs.length).toBe(2);
        expect(hs.indexOf("0,0")).not.toBe(-1);
        expect(hs.indexOf("0,1")).not.toBe(-1);
    });

    test("should return h of position and east neighbour", () => {
        const geometry = new GeohashGeometryProvider();

        const threshold: number = 20;
        const tileSize: number = 2 * (threshold + 1);

        setupSpies(tileSize);

        const hs: string[] = geometry.latLonToCellIds({ lat: 0.5, lon: 0 }, threshold);

        expect(hs.length).toBe(2);
        expect(hs.indexOf("0,0")).not.toBe(-1);
        expect(hs.indexOf("1,0")).not.toBe(-1);
    });

    test("should return h of position and south neighbour", () => {
        const geometry = new GeohashGeometryProvider();

        const threshold: number = 20;
        const tileSize: number = 2 * (threshold + 1);

        setupSpies(tileSize);

        const hs: string[] = geometry.latLonToCellIds({ lat: 0, lon: -0.5 }, threshold);

        expect(hs.length).toBe(2);
        expect(hs.indexOf("0,0")).not.toBe(-1);
        expect(hs.indexOf("0,-1")).not.toBe(-1);
    });

    test("should return h of position and west neighbour", () => {
        const geometry = new GeohashGeometryProvider();

        const threshold: number = 20;
        const tileSize: number = 2 * (threshold + 1);

        setupSpies(tileSize);

        const hs: string[] = geometry.latLonToCellIds({ lat: -0.5, lon: 0 }, threshold);

        expect(hs.length).toBe(2);
        expect(hs.indexOf("0,0")).not.toBe(-1);
        expect(hs.indexOf("-1,0")).not.toBe(-1);
    });

    test("should return h of position and north east neighbours", () => {
        const geometry = new GeohashGeometryProvider();

        const threshold: number = 20;
        const tileSize: number = 2 * (threshold + 1);

        setupSpies(tileSize);

        const hs: string[] = geometry.latLonToCellIds({ lat: 0.5, lon: 0.5 }, threshold);

        expect(hs.length).toBe(4);
        expect(hs.indexOf("0,0")).not.toBe(-1);
        expect(hs.indexOf("0,1")).not.toBe(-1);
        expect(hs.indexOf("1,1")).not.toBe(-1);
        expect(hs.indexOf("1,0")).not.toBe(-1);
    });

    test("should return h of position and south east neighbours", () => {
        const geometry = new GeohashGeometryProvider();

        const threshold: number = 20;
        const tileSize: number = 2 * (threshold + 1);

        setupSpies(tileSize);

        const hs: string[] = geometry.latLonToCellIds({ lat: 0.5, lon: -0.5 }, threshold);

        expect(hs.length).toBe(4);
        expect(hs.indexOf("0,0")).not.toBe(-1);
        expect(hs.indexOf("1,0")).not.toBe(-1);
        expect(hs.indexOf("1,-1")).not.toBe(-1);
        expect(hs.indexOf("0,-1")).not.toBe(-1);
    });

    test("should return h of position and south west neighbours", () => {
        const geometry = new GeohashGeometryProvider();

        const threshold: number = 20;
        const tileSize: number = 2 * (threshold + 1);

        setupSpies(tileSize);

        const hs: string[] = geometry.latLonToCellIds({ lat: -0.5, lon: -0.5 }, threshold);

        expect(hs.length).toBe(4);
        expect(hs.indexOf("0,0")).not.toBe(-1);
        expect(hs.indexOf("0,-1")).not.toBe(-1);
        expect(hs.indexOf("-1,-1")).not.toBe(-1);
        expect(hs.indexOf("-1,0")).not.toBe(-1);
    });

    test("should return h of position and north west neighbours", () => {
        const geometry = new GeohashGeometryProvider();

        const threshold: number = 20;
        const tileSize: number = 2 * (threshold + 1);

        setupSpies(tileSize);

        const hs: string[] = geometry.latLonToCellIds({ lat: -0.5, lon: 0.5 }, threshold);

        expect(hs.length).toBe(4);
        expect(hs.indexOf("0,0")).not.toBe(-1);
        expect(hs.indexOf("-1,0")).not.toBe(-1);
        expect(hs.indexOf("-1,1")).not.toBe(-1);
        expect(hs.indexOf("0,1")).not.toBe(-1);
    });

    test("should return h of position and all neighbours", () => {
        const geometry = new GeohashGeometryProvider();

        const threshold: number = 20;
        const tileSize: number = 2 * (threshold - 1);

        setupSpies(tileSize);

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
    test("should throw if north east is not larger than south west", () => {
        const geometry = new GeohashGeometryProvider();

        expect(() => { geometry.bboxToCellIds({ lat: 0, lon: 0 }, { lat: -1, lon: 1 }); })
            .toThrowError(MapillaryError);
        expect(() => { geometry.bboxToCellIds({ lat: 0, lon: 0 }, { lat: 1, lon: -1 }); })
            .toThrowError(MapillaryError);
        expect(() => { geometry.bboxToCellIds({ lat: 0, lon: 0 }, { lat: -1, lon: -1 }); })
            .toThrowError(MapillaryError);
    });

    test(
        "should call latLonToCellIds with center and correct threshold",
        () => {
            const geometry = new GeohashGeometryProvider();

            spyOn(GeoCoords, "geodeticToEnu").and.returnValue([10, 20, 0]);
            const encodeHsSpy: jasmine.Spy = spyOn(geometry, "latLonToCellIds").and.stub();

            geometry.bboxToCellIds({ lat: 0, lon: 0 }, { lat: 1, lon: 3 });

            expect(encodeHsSpy.calls.count()).toBe(1);
            expect(encodeHsSpy.calls.argsFor(0)[0].lat).toBe(0.5);
            expect(encodeHsSpy.calls.argsFor(0)[0].lon).toBe(1.5);
        });
});
