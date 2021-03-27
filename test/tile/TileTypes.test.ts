import {
    TILE_MIN_REQUEST_LEVEL,
    TILE_SIZE,
} from "../../src/tile/interfaces/TileTypes";

describe("MIN_REQUEST_LEVEL", () => {
    it("should return 11", () => {
        expect(TILE_MIN_REQUEST_LEVEL).toBe(11);
    });
});

describe("TILE_SIZE", () => {
    it("should return 1024", () => {
        expect(TILE_SIZE).toBe(1024);
    });
});
