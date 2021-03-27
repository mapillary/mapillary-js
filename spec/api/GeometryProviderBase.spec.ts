import { GeometryProviderBase } from "../../src/api/GeometryProviderBase";
import { LatLon } from "../../src/api/interfaces/LatLon";
import { MapillaryError } from "../../src/error/MapillaryError";
import * as GeoCoords from "../../src/geo/GeoCoords";
import { isClockwise } from "../helper/TestMath";

class GeometryProvider extends GeometryProviderBase {
    public bboxToCellIds(sw: LatLon, ne: LatLon): string[] {
        return this._approxBboxToCellIds(sw, ne);
    }

    public getVertices(cellId: string): LatLon[] {
        const ll = this._cellIdToLatLng(cellId);
        const lat = ll.lat;
        const lon = ll.lon;
        return [
            { lat: lat - 0.5, lon: lon + 0.5 },
            { lat: lat - 0.5, lon: lon - 0.5 },
            { lat: lat + 0.5, lon: lon - 0.5 },
            { lat: lat + 0.5, lon: lon + 0.5 },
        ];
    }

    public getAdjacent(cellId: string): string[] {
        const ll = this._cellIdToLatLng(cellId);
        const lat = ll.lat;
        const lon = ll.lon;
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

    public latLonToCellId(latLon: LatLon): string {
        const lat = latLon.lat;
        const lon = latLon.lon;
        return `${Math.round(lat)}/${Math.round(lon)}`;
    }

    private _cellIdToLatLng(cellId: string): LatLon {
        const [c0, c1] = cellId.split("/");
        const lat = Number.parseInt(c0, 10);
        const lon = Number.parseInt(c1, 10);
        return { lat, lon };
    }
}

describe("GeometryProvider.ctor", () => {
    it("should be defined", () => {
        const geometry = new GeometryProvider();
        expect(geometry).toBeDefined();
    });
});

describe("GeometryProvider.latLonToCellId", () => {
    it("should call geometry correctly", () => {
        const geometry = new GeometryProvider();
        const cellId = geometry.latLonToCellId({ lat: 0, lon: 0 });
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
        const sw: LatLon = { lat: -0.1, lon: -0.1 };
        const ne: LatLon = { lat: 0.1, lon: 0.1 };
        const cellIds = geometry.bboxToCellIds(sw, ne);

        expect(cellIds.length).toBe(1);
        expect(cellIds[0]).toBe("0/0");
    });

    it("should return cell and adjacent", () => {
        const geometry = new GeometryProvider();
        const sw: LatLon = { lat: -0.6, lon: -0.6 };
        const ne: LatLon = { lat: 0.6, lon: 0.6 };
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
        const sw: LatLon = { lat: -0.1, lon: -0.1 };
        const ne: LatLon = { lat: 0.1, lon: 0.6 };
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
        const sw: LatLon = { lat: -0.1, lon: -0.1 };
        const ne: LatLon = { lat: 0.6, lon: 0.1 };
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
                    { lat: 0, lon: 0 },
                    { lat: -1, lon: 1 });
        }).toThrowError(MapillaryError);

        expect(() => {
            geometry
                .bboxToCellIds(
                    { lat: 0, lon: 0 },
                    { lat: 1, lon: -1 });
        }).toThrowError(MapillaryError);

        expect(() => {
            geometry
                .bboxToCellIds(
                    { lat: 0, lon: 0 },
                    { lat: -1, lon: -1 });
        }).toThrowError(MapillaryError);
    });
});

describe("S2GeometryProvider.getCorners", () => {
    it("should be correctly placed relative to each other", () => {
        const geometry = new GeometryProvider();

        const latLons: LatLon[] = [
            { lat: 0, lon: 0 },
            { lat: 45, lon: 0 },
            { lat: 0, lon: 45 },
            { lat: -45, lon: 0 },
            { lat: 0, lon: -45 },
            { lat: 45, lon: 45 },
            { lat: -45, lon: -45 },
            { lat: 45, lon: -45 },
            { lat: -45, lon: 45 },
            { lat: -45, lon: 135 },
        ];

        for (let latLon of latLons) {
            const cellId = geometry.latLonToCellId(latLon);
            const vertices = geometry.getVertices(cellId);
            expect(vertices.length).toBe(4);

            const polygon = vertices
                .map(
                    (ll: LatLon): number[] => {
                        return [ll.lon, ll.lat];
                    });

            expect(isClockwise(polygon)).toBe(true);
        }
    });
});
