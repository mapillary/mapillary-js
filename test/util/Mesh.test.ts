import {
    hasReconstructionMesh,
    isDefaultCubeMesh,
} from "../../src/util/Mesh";

const cubeVertices: number[] = [
    -2.8867513459481287, -2.8867513459481287, -2.8867513459481287,
    -2.8867513459481287, -2.8867513459481287, 2.8867513459481287,
    -2.8867513459481287, 2.8867513459481287, -2.8867513459481287,
    -2.8867513459481287, 2.8867513459481287, 2.8867513459481287,
    2.8867513459481287, -2.8867513459481287, -2.8867513459481287,
    2.8867513459481287, -2.8867513459481287, 2.8867513459481287,
    2.8867513459481287, 2.8867513459481287, -2.8867513459481287,
    2.8867513459481287, 2.8867513459481287, 2.8867513459481287,
];

const cubeFaces: number[] = [
    6, 2, 0, 6, 4, 0, 5, 4, 0, 5, 1, 0,
    5, 6, 4, 5, 6, 7, 3, 2, 0, 3, 1, 0,
    3, 6, 2, 3, 6, 7, 3, 5, 1, 3, 5, 7,
];

describe("hasReconstructionMesh", () => {
    it("requires non-placeholder geometry", () => {
        expect(hasReconstructionMesh({ faces: [], vertices: [] })).toBe(false);
        expect(hasReconstructionMesh({
            faces: cubeFaces,
            vertices: cubeVertices,
        })).toBe(false);
        expect(hasReconstructionMesh({
            faces: [0, 1, 2],
            vertices: [0, 0, 0, 1, 1, 1, 2, 2, 2],
        })).toBe(true);
    });
});

describe("isDefaultCubeMesh", () => {
    it("identifies the default cube", () => {
        expect(isDefaultCubeMesh({ faces: cubeFaces, vertices: cubeVertices }))
            .toBe(true);
    });

    it("keeps reconstructed meshes", () => {
        const vertices = cubeVertices.slice();
        vertices[0] = -3.5;

        expect(isDefaultCubeMesh({ faces: cubeFaces, vertices })).toBe(false);
    });

    it("keeps empty meshes", () => {
        expect(isDefaultCubeMesh({ faces: [], vertices: [] })).toBe(false);
    });
});
