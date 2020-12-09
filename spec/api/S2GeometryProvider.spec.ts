import { S2 } from "s2-geometry";

import GeoCoords from "../../src/geo/GeoCoords";
import MapillaryError from "../../src/error/MapillaryError";
import S2GeometryProvider from "../../src/api/S2GeometryProvider";
import { ILatLon } from "../../src/API";
import ICellCorners from "../../src/api/interfaces/ICellCorners";

describe("S2GeometryProvider.ctor", () => {
    it("should be defined", () => {
        const geometry: S2GeometryProvider = new S2GeometryProvider();

        expect(geometry).toBeDefined();
    });
});

describe("GS2GeometryProvider.latLonToCellId", () => {
    it("should call geometry correctly", () => {
        const keySpy: jasmine.Spy = spyOn(S2, "latLngToKey");
        const idSpy: jasmine.Spy = spyOn(S2, "keyToId");
        keySpy.and.returnValue("0/0");
        idSpy.and.returnValue("0.0");

        const geometry: S2GeometryProvider = new S2GeometryProvider();

        const lat: number = -1;
        const lon: number = 1;

        geometry.latLonToCellId({ lat: -1, lon: 1 });

        expect(keySpy.calls.count()).toBe(1);
        expect(keySpy.calls.first().args[0]).toBe(lat);
        expect(keySpy.calls.first().args[1]).toBe(lon);

        expect(idSpy.calls.count()).toBe(1);
        expect(idSpy.calls.first().args[0]).toBe("0/0");
    });
});

describe("S2GeometryProvider.latLonToCellIds", () => {
    const setupSpies: (geoCoords: GeoCoords, tileSize: number) => void =
        (geoCoords: GeoCoords, tileSize: number): void => {
            spyOn(S2, "latLngToKey").and.callFake(
                (lat: number, lng: number): string => {
                    return `${Math.round(lat)}/${Math.round(lng)}`;
                });

            spyOn(S2, "keyToId").and.callFake(
                (key: string): string => {
                    const [k0, k1]: string[] = key.split("/");
                    return `${k0}.${k1}`;
                });

            spyOn(S2, "idToKey").and.callFake(
                (id: string): string => {
                    const [i0, i1]: string[] = id.split(".");
                    return `${i0}/${i1}`;
                });

            spyOn(S2, "keyToLatLng").and.callFake(
                (key: string): S2.ILatLng => {
                    const [k0, k1]: string[] = key.split("/");
                    const lat: number = Number.parseInt(k0, 10);
                    const lng: number = Number.parseInt(k1, 10);

                    return { lat: lat, lng: lng };
                });

            spyOn(S2.S2Cell, "FromHilbertQuadKey").and.callFake(
                (key: string): S2.S2Cell => {
                    const [k0, k1]: string[] = key.split("/");
                    const lat: number = Number.parseInt(k0, 10);
                    const lng: number = Number.parseInt(k1, 10);

                    const s2Cell: S2.S2Cell = new S2.S2Cell();
                    spyOn(s2Cell, "getCornerLatLngs").and.returnValue([
                        { lat: lat - 0.5, lng: lng + 0.5 },
                        { lat: lat - 0.5, lng: lng - 0.5 },
                        { lat: lat + 0.5, lng: lng - 0.5 },
                        { lat: lat + 0.5, lng: lng + 0.5 },
                    ]);

                    return s2Cell;
                });

            spyOn(S2, "latLngToNeighborKeys").and.callFake(
                (lat: number, lng: number): string[] => {
                    return [
                        `${lat}/${lng - 1}`,
                        `${lat + 1}/${lng}`,
                        `${lat}/${lng + 1}`,
                        `${lat - 1}/${lng}`,
                    ];
                });

            spyOn(geoCoords, "enuToGeodetic").and.callFake(
                (x: number, y: number, _: number, refLat: number, refLon: number): number[] => {
                    return [
                        refLon + x / tileSize,
                        refLat + y / tileSize,
                        0];
                });
        };

    it("should return cell id of position only", () => {
        const geoCoords: GeoCoords = new GeoCoords();
        const geometry: S2GeometryProvider = new S2GeometryProvider(geoCoords);

        const threshold: number = 20;
        const tileSize: number = 2 * (threshold + 1);

        setupSpies(geoCoords, tileSize);

        const cellIds: string[] = geometry.latLonToCellIds({ lat: 0, lon: 0 }, threshold);

        expect(cellIds.length).toBe(1);
        expect(cellIds[0]).toBe("0.0");
    });

    it("should return cell id of position and all neighbours when tile outside", () => {
        const geoCoords: GeoCoords = new GeoCoords();
        const geometry: S2GeometryProvider = new S2GeometryProvider(geoCoords);

        const threshold: number = 20;
        const tileSize: number = 2 * (threshold - 1);

        setupSpies(geoCoords, tileSize);

        const cellIds: string[] = geometry.latLonToCellIds({ lat: 0, lon: 0 }, threshold);

        expect(cellIds.length).toBe(9);
        expect(cellIds.indexOf("0.0")).not.toBe(-1);
        expect(cellIds.indexOf("0.1")).not.toBe(-1);
        expect(cellIds.indexOf("-1.1")).not.toBe(-1);
        expect(cellIds.indexOf("-1.0")).not.toBe(-1);
        expect(cellIds.indexOf("-1.-1")).not.toBe(-1);
        expect(cellIds.indexOf("0.-1")).not.toBe(-1);
        expect(cellIds.indexOf("1.-1")).not.toBe(-1);
        expect(cellIds.indexOf("1.0")).not.toBe(-1);
        expect(cellIds.indexOf("1.1")).not.toBe(-1);
    });

    it("should return cell id of position and all neighbours when outside", () => {
        const geoCoords: GeoCoords = new GeoCoords();
        const geometry: S2GeometryProvider = new S2GeometryProvider(geoCoords);

        const threshold: number = 20;
        const tileSize: number = 2 * (threshold + 1);

        setupSpies(geoCoords, tileSize);

        const cellIds: string[] = geometry.latLonToCellIds({ lat: 0, lon: 0.4 }, threshold);

        expect(cellIds.length).toBe(9);
        expect(cellIds.indexOf("0.0")).not.toBe(-1);
        expect(cellIds.indexOf("0.1")).not.toBe(-1);
        expect(cellIds.indexOf("-1.1")).not.toBe(-1);
        expect(cellIds.indexOf("-1.0")).not.toBe(-1);
        expect(cellIds.indexOf("-1.-1")).not.toBe(-1);
        expect(cellIds.indexOf("0.-1")).not.toBe(-1);
        expect(cellIds.indexOf("1.-1")).not.toBe(-1);
        expect(cellIds.indexOf("1.0")).not.toBe(-1);
        expect(cellIds.indexOf("1.1")).not.toBe(-1);
    });

    it("should return cell id of position and all neighbours when outside", () => {
        const geoCoords: GeoCoords = new GeoCoords();
        const geometry: S2GeometryProvider = new S2GeometryProvider(geoCoords);

        const threshold: number = 20;
        const tileSize: number = 2 * (threshold + 1);

        setupSpies(geoCoords, tileSize);

        const cellIds: string[] = geometry.latLonToCellIds({ lat: 0.4, lon: 0 }, threshold);

        expect(cellIds.length).toBe(9);
        expect(cellIds.indexOf("0.0")).not.toBe(-1);
        expect(cellIds.indexOf("0.1")).not.toBe(-1);
        expect(cellIds.indexOf("-1.1")).not.toBe(-1);
        expect(cellIds.indexOf("-1.0")).not.toBe(-1);
        expect(cellIds.indexOf("-1.-1")).not.toBe(-1);
        expect(cellIds.indexOf("0.-1")).not.toBe(-1);
        expect(cellIds.indexOf("1.-1")).not.toBe(-1);
        expect(cellIds.indexOf("1.0")).not.toBe(-1);
        expect(cellIds.indexOf("1.1")).not.toBe(-1);
    });
});

describe("S2GeometryProvider.bboxToCellIds", () => {
    it("should throw if north east is not larger than south west", () => {
        const geometry: S2GeometryProvider = new S2GeometryProvider();

        expect(() => { geometry.bboxToCellIds({ lat: 0, lon: 0 }, { lat: -1, lon: 1 }); })
            .toThrowError(MapillaryError);
        expect(() => { geometry.bboxToCellIds({ lat: 0, lon: 0 }, { lat: 1, lon: -1 }); })
            .toThrowError(MapillaryError);
        expect(() => { geometry.bboxToCellIds({ lat: 0, lon: 0 }, { lat: -1, lon: -1 }); })
            .toThrowError(MapillaryError);
    });

    it("should call latLonToCellIds with center and correct threshold", () => {
        const geoCoords: GeoCoords = new GeoCoords();
        const geometry: S2GeometryProvider = new S2GeometryProvider(geoCoords);

        spyOn(geoCoords, "geodeticToEnu").and.returnValue([10, 20, 0]);
        const encodeHsSpy: jasmine.Spy = spyOn(geometry, "latLonToCellIds").and.stub();

        geometry.bboxToCellIds({ lat: 0, lon: 0 }, { lat: 1, lon: 3 });

        expect(encodeHsSpy.calls.count()).toBe(1);
        expect(encodeHsSpy.calls.argsFor(0)[0].lat).toBe(0.5);
        expect(encodeHsSpy.calls.argsFor(0)[0].lon).toBe(1.5);
    });
});

describe("S2GeometryProvider.getCorners", () => {
    it("should be correctly placed relative to each other", () => {
        const geometry: S2GeometryProvider = new S2GeometryProvider();

        const latLons: ILatLon[] = [
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
            const cellId: string = geometry.latLonToCellId(latLon);
            const corners: ICellCorners = geometry.getCorners(cellId);

            expect(corners.se.lat).toBeLessThan(corners.ne.lat);
            expect(corners.se.lat).toBeLessThan(corners.nw.lat);

            expect(corners.sw.lat).toBeLessThan(corners.ne.lat);
            expect(corners.sw.lat).toBeLessThan(corners.nw.lat);

            expect(corners.sw.lon).toBeLessThan(corners.se.lon);
            expect(corners.sw.lon).toBeLessThan(corners.ne.lon);

            expect(corners.nw.lon).toBeLessThan(corners.se.lon);
            expect(corners.nw.lon).toBeLessThan(corners.ne.lon);
        }
    });
});
