import { LatLon } from "../../src/api/interfaces/LatLon";
import * as GeoCoords from "../../src/geo/GeoCoords";
import { GraphCalculator } from "../../src/graph/GraphCalculator";

describe("GraphCalculator.ctor", () => {
    it("should be defined", () => {
        let calculator: GraphCalculator = new GraphCalculator();

        expect(calculator).toBeDefined();
    });
});

describe("GraphCalculator.boundingBoxCorners", () => {
    it("should return sw and ne in correct order", () => {
        spyOn(GeoCoords, "enuToGeodetic").and.callFake(
            (x: number, y: number, z: number, refLat: number, refLon: number, refAlt: number): number[] => {
                return [refLat + x, refLon + y, refAlt + z];
            });

        let calculator: GraphCalculator = new GraphCalculator();

        let threshold: number = 1;
        let bbox: [LatLon, LatLon] = calculator.boundingBoxCorners({ lat: 0, lon: 0 }, threshold);

        expect(bbox.length).toBe(2);
        expect(bbox[0].lat).toBe(-1);
        expect(bbox[0].lon).toBe(-1);
        expect(bbox[1].lat).toBe(1);
        expect(bbox[1].lon).toBe(1);
    });
});
