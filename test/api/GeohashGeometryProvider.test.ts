import * as geohash from "latlon-geohash";
import { GeohashGeometryProvider } from "../../src/api/GeohashGeometryProvider";
import { LngLat } from "../../src/api/interfaces/LngLat";
import { MapillaryError } from "../../src/error/MapillaryError";
import * as GeoCoords from "../../src/geo/GeoCoords";

describe("GeohashGeometryProvider.ctor", () => {
    test("should be defined", () => {
        const geometry = new GeohashGeometryProvider();
        expect(geometry).toBeDefined();
    });
});

describe("GeohashGeometryProvider.lngLatToCellId", () => {
    test("should call encoder correctly", () => {
        const mockEncode = spyOn(geohash, "encode").and.returnValue("0/0");

        const level = 22;
        const geometry = new GeohashGeometryProvider(level);
        const lat = -1;
        const lon = 1;
        geometry.lngLatToCellId({ lat, lng: lon });

        expect(mockEncode).toHaveBeenCalledTimes(1);
        expect(mockEncode).toHaveBeenCalledWith(lat, lon, level);
    });
});

describe("GeohashGeometryProvider.bboxToCellIds", () => {
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

            spyOn(GeoCoords, "geodeticToEnu").and.callFake(
                (
                    lat: number,
                    lon: number,
                    _: number,
                    refLat: number,
                    refLon: number)
                    : number[] => {
                    return [
                        tileSize * (lat - refLat),
                        tileSize * (lon - refLon),
                        0];
                });

            spyOn(GeoCoords, "enuToGeodetic").and.callFake(
                (x: number, y: number, _: number, refLat: number, refLon: number): number[] => {
                    return [
                        refLat + y / tileSize,
                        refLon + x / tileSize,
                        0];
                });
        };

    test("should return cell", () => {
        const geometry = new GeohashGeometryProvider();
        const tileSize = 1;
        setupSpies(tileSize);

        const sw: LngLat = { lat: -0.1, lng: -0.1 };
        const ne: LngLat = { lat: 0.1, lng: 0.1 };
        const cellIds = geometry.bboxToCellIds(sw, ne);

        expect(cellIds.length).toBe(1);
        expect(cellIds[0]).toBe("0/0");
    });

    test("should return cell and adjacent", () => {
        const geometry = new GeohashGeometryProvider();
        const tileSize = 1;
        setupSpies(tileSize);

        const sw: LngLat = { lat: -0.6, lng: -0.6 };
        const ne: LngLat = { lat: 0.6, lng: 0.6 };
        const cellIds = geometry.bboxToCellIds(sw, ne);

        expect(cellIds.length).toBe(9);
        expect(cellIds.indexOf("0/0")).not.toBe(-1);
        expect(cellIds.indexOf("0/1")).not.toBe(-1);
        expect(cellIds.indexOf("0/-1")).not.toBe(-1);
        expect(cellIds.indexOf("1/0")).not.toBe(-1);
        expect(cellIds.indexOf("1/-1")).not.toBe(-1);
        expect(cellIds.indexOf("1/1")).not.toBe(-1);
        expect(cellIds.indexOf("-1/0")).not.toBe(-1);
        expect(cellIds.indexOf("-1/-1")).not.toBe(-1);
        expect(cellIds.indexOf("-1/1")).not.toBe(-1);
    });
});

describe("GeohashGeometryProvider.bboxToCellIds", () => {
    test("should throw if north east is not larger than south west", () => {
        const geometry = new GeohashGeometryProvider();

        expect(() => {
            geometry
                .bboxToCellIds(
                    { lat: 0, lng: 0 },
                    { lat: -1, lng: 1 });
        }).toThrowError(MapillaryError);

        expect(() => {
            geometry
                .bboxToCellIds(
                    { lat: 0, lng: 0 },
                    { lat: 1, lng: -1 });
        }).toThrowError(MapillaryError);

        expect(() => {
            geometry
                .bboxToCellIds(
                    { lat: 0, lng: 0 },
                    { lat: -1, lng: -1 });
        }).toThrowError(MapillaryError);
    });

    describe("GeohashGeometryProvider.getAdjacent", () => {
        it("should always be 8", () => {
            const geometry = new GeohashGeometryProvider();

            const lngLats: LngLat[] = [
                { lat: 45, lng: 0 },
                { lat: 0, lng: 45 },
                { lat: -45, lng: 0 },
                { lat: 0, lng: -45 },
                { lat: 45, lng: 45 },
                { lat: -45, lng: -45 },
                { lat: 45, lng: -45 },
                { lat: -45, lng: 45 },
                { lat: -45, lng: 135 },
                { lat: -45, lng: 180 },
                { lat: 0, lng: 180 },
                { lat: 45, lng: 180 },
            ];

            for (let lngLat of lngLats) {
                const cellId = geometry.lngLatToCellId(lngLat);
                const adjacent = geometry.getAdjacent(cellId);
                expect(adjacent.length).toBe(8);
            }
        });
    });
});
