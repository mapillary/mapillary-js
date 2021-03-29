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
            (
                x: number,
                y: number,
                z: number,
                refLng: number,
                refLat: number,
                refAlt: number)
                : number[] => {
                return [
                    refLng + x,
                    refLat + y,
                    refAlt + z];
            });

        let calculator = new GraphCalculator();

        let threshold = 1;
        let [sw, ne] = calculator
            .boundingBoxCorners(
                { lat: 0, lng: 10 },
                threshold);

        expect(sw.lng).toBe(9);
        expect(sw.lat).toBe(-1);
        expect(ne.lng).toBe(11);
        expect(ne.lat).toBe(1);
    });
});
