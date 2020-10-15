import GraphCalculator from "../../src/graph/GraphCalculator";
import GeoCoords from "../../src/geo/GeoCoords";
import ILatLon from "../../src/api/interfaces/ILatLon";

describe("GraphCalculator.ctor", () => {
    it("should be defined", () => {
        let calculator: GraphCalculator = new GraphCalculator();

        expect(calculator).toBeDefined();
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
