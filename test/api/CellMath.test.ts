import { connectedComponent } from "../../src/api/CellMath";
import { S2GeometryProvider } from "../../src/api/S2GeometryProvider";

describe("connectedComponent", () => {
    it("should have the correct number of ids", () => {
        const geometry = new S2GeometryProvider();
        const cellId = geometry.lngLatToCellId({ lat: 10, lng: 20 });

        expect(connectedComponent(cellId, 0, geometry).length).toBe(1);
        expect(connectedComponent(cellId, 1, geometry).length).toBe(3 * 3);
        expect(connectedComponent(cellId, 2, geometry).length).toBe(5 * 5);
        expect(connectedComponent(cellId, 3, geometry).length).toBe(7 * 7);
        expect(connectedComponent(cellId, 6, geometry).length).toBe(13 * 13);
    });

    it("should have unique ids", () => {
        const geometry = new S2GeometryProvider();
        const cellId = geometry.lngLatToCellId({ lat: 20, lng: -20 });

        const cc0 = connectedComponent(cellId, 0, geometry);
        expect(cc0.length).toBe(new Set(cc0).size);

        const cc1 = connectedComponent(cellId, 1, geometry);
        expect(cc1.length).toBe(new Set(cc1).size);

        const cc2 = connectedComponent(cellId, 2, geometry);
        expect(cc2.length).toBe(new Set(cc2).size);

        const cc3 = connectedComponent(cellId, 3, geometry);
        expect(cc3.length).toBe(new Set(cc3).size);

        const cc6 = connectedComponent(cellId, 6, geometry);
        expect(cc6.length).toBe(new Set(cc6).size);

    });
});
