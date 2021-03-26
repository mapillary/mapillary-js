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
        const mockEncode = mockedGeohash.encode.mockReturnValueOnce("0/0");

        const level = 7;
        const geometry = new GeohashGeometryProvider();

        const lat = -1;
        const lon = 1;

        geometry.latLonToCellId({ lat: -1, lon: 1 });

        expect(mockEncode).toHaveBeenCalledTimes(1);
        expect(mockEncode).toHaveBeenCalledWith(lat, lon, level);
    });
});

describe("GeohashGeometryProvider.latLonToCellIds", () => {
    const setupSpies: (tileSize: number) => void =
        (tileSize: number): void => {
            spyOn(geohash, "encode").and.callFake(
                (lat: number, lng: number): string => {
                    return `${Math.round(lat)}/${Math.round(lng)}`;
                });

            spyOn(geohash, "decode").and.callFake(
                (cellId: string): geohash.Point => {
                    const [lat, lng] = cellId.split("/");
                    return {
                        lat: parseInt(lat, 10),
                        lon: parseInt(lng, 10),
                    };
                });

            spyOn(geohash, "bounds").and.callFake(
                (lat: number, lng: number): geohash.Bounds => {
                    return {
                        ne: { lat: lat + 0.5, lon: lng + 0.5 },
                        sw: { lat: lat - 0.5, lon: lng - 0.5 },
                    }
                });

            spyOn(geohash, "neighbours").and.callFake(
                (cellId: string): geohash.Neighbours => {
                    const ll = geohash.decode(cellId);
                    const lat = ll.lat;
                    const lng = ll.lon;
                    return {
                        w: `${lat}/${lng - 1}`,
                        n: `${lat + 1}/${lng}`,
                        e: `${lat}/${lng + 1}`,
                        s: `${lat - 1}/${lng}`,
                        nw: `${lat + 1}/${lng - 1}`,
                        ne: `${lat + 1}/${lng + 1}`,
                        sw: `${lat - 1}/${lng - 1}`,
                        se: `${lat - 1}/${lng + 1}`,
                    };
                });

            spyOn(GeoCoords, "enuToGeodetic").and.callFake(
                (x: number, y: number, _: number, refLat: number, refLon: number): number[] => {
                    return [
                        refLat + y / tileSize,
                        refLon + x / tileSize,
                        0];
                });
        };

    test("should return h of position only", () => {
        const geometry = new GeohashGeometryProvider();

        const threshold = 20;
        const tileSize = 2 * (threshold + 1);

        setupSpies(tileSize);

        const hs = geometry.latLonToCellIds({ lat: 0, lon: 0 }, threshold);

        expect(hs.length).toBe(1);
        expect(hs[0]).toBe("0/0");
    });

    test("should return h of position and north neighbour", () => {
        const geometry = new GeohashGeometryProvider();

        const threshold = 20;
        const tileSize = 2 * (threshold + 1);

        setupSpies(tileSize);

        const hs = geometry
            .latLonToCellIds(
                { lat: 0, lon: 0.4 },
                threshold);

        expect(hs.length).toBe(9);
        expect(hs.indexOf("0/0")).not.toBe(-1);
        expect(hs.indexOf("0/1")).not.toBe(-1);
        expect(hs.indexOf("0/-1")).not.toBe(-1);
        expect(hs.indexOf("1/0")).not.toBe(-1);
        expect(hs.indexOf("1/-1")).not.toBe(-1);
        expect(hs.indexOf("1/1")).not.toBe(-1);
        expect(hs.indexOf("-1/0")).not.toBe(-1);
        expect(hs.indexOf("-1/-1")).not.toBe(-1);
        expect(hs.indexOf("-1/1")).not.toBe(-1);
    });

    test("should return neighbors", () => {
        const geometry = new GeohashGeometryProvider();

        const threshold = 20;
        const tileSize = 2 * (threshold + 1);

        setupSpies(tileSize);

        const hs = geometry
            .latLonToCellIds(
                { lat: 0.4, lon: 0 },
                threshold);

        expect(hs.length).toBe(9);
        expect(hs.indexOf("0/0")).not.toBe(-1);
        expect(hs.indexOf("0/1")).not.toBe(-1);
        expect(hs.indexOf("0/-1")).not.toBe(-1);
        expect(hs.indexOf("1/0")).not.toBe(-1);
        expect(hs.indexOf("1/-1")).not.toBe(-1);
        expect(hs.indexOf("1/1")).not.toBe(-1);
        expect(hs.indexOf("-1/0")).not.toBe(-1);
        expect(hs.indexOf("-1/-1")).not.toBe(-1);
        expect(hs.indexOf("-1/1")).not.toBe(-1);
    });

    test("should return neighbors", () => {
        const geometry = new GeohashGeometryProvider();

        const threshold = 20;
        const tileSize = 2 * (threshold + 1);

        setupSpies(tileSize);

        const hs = geometry
            .latLonToCellIds(
                { lat: 0, lon: -0.4 },
                threshold);

        expect(hs.length).toBe(9);
        expect(hs.indexOf("0/0")).not.toBe(-1);
        expect(hs.indexOf("0/1")).not.toBe(-1);
        expect(hs.indexOf("0/-1")).not.toBe(-1);
        expect(hs.indexOf("1/0")).not.toBe(-1);
        expect(hs.indexOf("1/-1")).not.toBe(-1);
        expect(hs.indexOf("1/1")).not.toBe(-1);
        expect(hs.indexOf("-1/0")).not.toBe(-1);
        expect(hs.indexOf("-1/-1")).not.toBe(-1);
        expect(hs.indexOf("-1/1")).not.toBe(-1);
    });

    test("should return neighbours", () => {
        const geometry = new GeohashGeometryProvider();

        const threshold = 20;
        const tileSize = 2 * (threshold + 1);

        setupSpies(tileSize);

        const hs = geometry
            .latLonToCellIds(
                { lat: -0.4, lon: 0 },
                threshold);

        expect(hs.length).toBe(9);
        expect(hs.indexOf("0/0")).not.toBe(-1);
        expect(hs.indexOf("0/1")).not.toBe(-1);
        expect(hs.indexOf("0/-1")).not.toBe(-1);
        expect(hs.indexOf("1/0")).not.toBe(-1);
        expect(hs.indexOf("1/-1")).not.toBe(-1);
        expect(hs.indexOf("1/1")).not.toBe(-1);
        expect(hs.indexOf("-1/0")).not.toBe(-1);
        expect(hs.indexOf("-1/-1")).not.toBe(-1);
        expect(hs.indexOf("-1/1")).not.toBe(-1);
    });

    test("should return h of position and north east neighbours", () => {
        const geometry = new GeohashGeometryProvider();

        const threshold = 20;
        const tileSize = 2 * (threshold + 1);

        setupSpies(tileSize);

        const hs = geometry
            .latLonToCellIds(
                { lat: 0.4, lon: 0.4 },
                threshold);

        expect(hs.length).toBe(9);
        expect(hs.indexOf("0/0")).not.toBe(-1);
        expect(hs.indexOf("0/1")).not.toBe(-1);
        expect(hs.indexOf("0/-1")).not.toBe(-1);
        expect(hs.indexOf("1/0")).not.toBe(-1);
        expect(hs.indexOf("1/-1")).not.toBe(-1);
        expect(hs.indexOf("1/1")).not.toBe(-1);
        expect(hs.indexOf("-1/0")).not.toBe(-1);
        expect(hs.indexOf("-1/-1")).not.toBe(-1);
        expect(hs.indexOf("-1/1")).not.toBe(-1);
    });

    test("should return h of position and all neighbours", () => {
        const geometry = new GeohashGeometryProvider();

        const threshold = 20;
        const tileSize = 2 * (threshold - 1);

        setupSpies(tileSize);

        const hs = geometry
            .latLonToCellIds(
                { lat: 0, lon: 0 },
                threshold);

        expect(hs.length).toBe(9);
        expect(hs.indexOf("0/0")).not.toBe(-1);
        expect(hs.indexOf("0/1")).not.toBe(-1);
        expect(hs.indexOf("-1/1")).not.toBe(-1);
        expect(hs.indexOf("-1/0")).not.toBe(-1);
        expect(hs.indexOf("-1/-1")).not.toBe(-1);
        expect(hs.indexOf("0/-1")).not.toBe(-1);
        expect(hs.indexOf("1/-1")).not.toBe(-1);
        expect(hs.indexOf("1/0")).not.toBe(-1);
        expect(hs.indexOf("1/1")).not.toBe(-1);
    });
});

describe("GeohashGeometryProvider.bboxToCellIds", () => {
    test("should throw if north east is not larger than south west", () => {
        const geometry = new GeohashGeometryProvider();

        expect(() => {
            geometry.bboxToCellIds(
                { lat: 0, lon: 0 },
                { lat: -1, lon: 1 });
        })
            .toThrowError(MapillaryError);
        expect(() => {
            geometry.bboxToCellIds(
                { lat: 0, lon: 0 },
                { lat: 1, lon: -1 });
        })
            .toThrowError(MapillaryError);
        expect(() => {
            geometry.bboxToCellIds(
                { lat: 0, lon: 0 },
                { lat: -1, lon: -1 });
        })
            .toThrowError(MapillaryError);
    });

    test(
        "should call latLonToCellIds with center and correct threshold",
        () => {
            const geometry = new GeohashGeometryProvider();

            spyOn(GeoCoords, "geodeticToEnu").and.returnValue([10, 20, 0]);
            const encodeHsSpy = spyOn(geometry, "latLonToCellIds").and.stub();

            geometry.bboxToCellIds({ lat: 0, lon: 0 }, { lat: 1, lon: 3 });

            expect(encodeHsSpy.calls.count()).toBe(1);
            expect(encodeHsSpy.calls.argsFor(0)[0].lat).toBe(0.5);
            expect(encodeHsSpy.calls.argsFor(0)[0].lon).toBe(1.5);
        });
});
