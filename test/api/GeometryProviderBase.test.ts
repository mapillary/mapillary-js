import { GeometryProviderBase } from "../../src/api/GeometryProviderBase";
import { LngLat } from "../../src/api/interfaces/LngLat";
import { MapillaryError } from "../../src/error/MapillaryError";
import * as GeoCoords from "../../src/geo/GeoCoords";
import { isClockwise } from "../helper/TestMath";

class GeometryProvider extends GeometryProviderBase {
    public bboxToCellIds(sw: LngLat, ne: LngLat): string[] {
        return this._approxBboxToCellIds(sw, ne);
    }

    public getVertices(cellId: string): LngLat[] {
        const ll = this._cellIdToLatLng(cellId);
        const lat = ll.lat;
        const lon = ll.lng;
        return [
            { lat: lat - 0.5, lng: lon + 0.5 },
            { lat: lat - 0.5, lng: lon - 0.5 },
            { lat: lat + 0.5, lng: lon - 0.5 },
            { lat: lat + 0.5, lng: lon + 0.5 },
        ];
    }

    public getAdjacent(cellId: string): string[] {
        const ll = this._cellIdToLatLng(cellId);
        const lat = ll.lat;
        const lon = ll.lng;
        return [
            `${lat}/${lon - 1}`,
            `${lat + 1}/${lon}`,
            `${lat}/${lon + 1}`,
            `${lat - 1}/${lon}`,
            `${lat + 1}/${lon - 1}`,
            `${lat + 1}/${lon + 1}`,
            `${lat - 1}/${lon - 1}`,
            `${lat - 1}/${lon + 1}`,
        ];
    }

    public lngLatToCellId(lngLat: LngLat): string {
        const lat = lngLat.lat;
        const lon = lngLat.lng;
        return `${Math.round(lat)}/${Math.round(lon)}`;
    }

    private _cellIdToLatLng(cellId: string): LngLat {
        const [c0, c1] = cellId.split("/");
        const lat = Number.parseInt(c0, 10);
        const lon = Number.parseInt(c1, 10);
        return { lat, lng: lon };
    }
}

describe("GeometryProvider.ctor", () => {
    it("should be defined", () => {
        const geometry = new GeometryProvider();
        expect(geometry).toBeDefined();
    });
});

describe("GeometryProvider.lngLatToCellId", () => {
    it("should call geometry correctly", () => {
        const geometry = new GeometryProvider();
        const cellId = geometry.lngLatToCellId({ lat: 0, lng: 0 });
        expect(cellId).toBe("0/0");
    });
});

describe("GeometryProvider.bboxToCellIds", () => {
    beforeEach(() => {
        spyOn(GeoCoords, "geodeticToEnu").and.callFake(
            (
                lat: number,
                lon: number,
                _: number,
                refLat: number,
                refLon: number)
                : number[] => {
                return [
                    refLon + lon,
                    refLat + lat,
                    0];
            });

        spyOn(GeoCoords, "enuToGeodetic").and.callFake(
            (x: number, y: number, _: number, refLat: number, refLon: number): number[] => {
                return [
                    refLon + x,
                    refLat + y,
                    0];
            });
    })

    it("should return cell", () => {
        const geometry = new GeometryProvider();
        const sw: LngLat = { lat: -0.1, lng: -0.1 };
        const ne: LngLat = { lat: 0.1, lng: 0.1 };
        const cellIds = geometry.bboxToCellIds(sw, ne);

        expect(cellIds.length).toBe(1);
        expect(cellIds[0]).toBe("0/0");
    });

    it("should return cell and adjacent", () => {
        const geometry = new GeometryProvider();
        const sw: LngLat = { lat: -0.6, lng: -0.6 };
        const ne: LngLat = { lat: 0.6, lng: 0.6 };
        const cellIds = geometry.bboxToCellIds(sw, ne);

        expect(cellIds.length).toBe(9);
        expect(cellIds.indexOf("0/0")).not.toBe(-1);
        expect(cellIds.indexOf("0/1")).not.toBe(-1);
        expect(cellIds.indexOf("0/-1")).not.toBe(-1);
        expect(cellIds.indexOf("-1/1")).not.toBe(-1);
        expect(cellIds.indexOf("-1/0")).not.toBe(-1);
        expect(cellIds.indexOf("-1/-1")).not.toBe(-1);
        expect(cellIds.indexOf("1/-1")).not.toBe(-1);
        expect(cellIds.indexOf("1/0")).not.toBe(-1);
        expect(cellIds.indexOf("1/1")).not.toBe(-1);
    });

    it("should return cell and adjacent", () => {
        const geometry = new GeometryProvider();
        const sw: LngLat = { lat: -0.1, lng: -0.1 };
        const ne: LngLat = { lat: 0.1, lng: 0.6 };
        const cellIds = geometry.bboxToCellIds(sw, ne);

        expect(cellIds.length).toBe(9);
        expect(cellIds.indexOf("0/0")).not.toBe(-1);
        expect(cellIds.indexOf("0/1")).not.toBe(-1);
        expect(cellIds.indexOf("0/-1")).not.toBe(-1);
        expect(cellIds.indexOf("-1/1")).not.toBe(-1);
        expect(cellIds.indexOf("-1/0")).not.toBe(-1);
        expect(cellIds.indexOf("-1/-1")).not.toBe(-1);
        expect(cellIds.indexOf("1/-1")).not.toBe(-1);
        expect(cellIds.indexOf("1/0")).not.toBe(-1);
        expect(cellIds.indexOf("1/1")).not.toBe(-1);
    });

    it("should return cell and adjacent", () => {
        const geometry = new GeometryProvider();
        const sw: LngLat = { lat: -0.1, lng: -0.1 };
        const ne: LngLat = { lat: 0.6, lng: 0.1 };
        const cellIds = geometry.bboxToCellIds(sw, ne);

        expect(cellIds.length).toBe(9);
        expect(cellIds.indexOf("0/0")).not.toBe(-1);
        expect(cellIds.indexOf("0/1")).not.toBe(-1);
        expect(cellIds.indexOf("0/-1")).not.toBe(-1);
        expect(cellIds.indexOf("-1/1")).not.toBe(-1);
        expect(cellIds.indexOf("-1/0")).not.toBe(-1);
        expect(cellIds.indexOf("-1/-1")).not.toBe(-1);
        expect(cellIds.indexOf("1/-1")).not.toBe(-1);
        expect(cellIds.indexOf("1/0")).not.toBe(-1);
        expect(cellIds.indexOf("1/1")).not.toBe(-1);
    });
});

describe("S2GeometryProvider.bboxToCellIds", () => {
    it("should throw if north east is not larger than south west", () => {
        const geometry = new GeometryProvider();

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
});

describe("S2GeometryProvider.getCorners", () => {
    it("should be correctly placed relative to each other", () => {
        const geometry = new GeometryProvider();

        const lngLats: LngLat[] = [
            { lat: 0, lng: 0 },
            { lat: 45, lng: 0 },
            { lat: 0, lng: 45 },
            { lat: -45, lng: 0 },
            { lat: 0, lng: -45 },
            { lat: 45, lng: 45 },
            { lat: -45, lng: -45 },
            { lat: 45, lng: -45 },
            { lat: -45, lng: 45 },
            { lat: -45, lng: 135 },
        ];

        for (let lngLat of lngLats) {
            const cellId = geometry.lngLatToCellId(lngLat);
            const vertices = geometry.getVertices(cellId);
            expect(vertices.length).toBe(4);

            const polygon = vertices
                .map(
                    (ll: LngLat): number[] => {
                        return [ll.lng, ll.lat];
                    });

            expect(isClockwise(polygon)).toBe(true);
        }
    });
});
