import {
    BufferAttribute,
    Line,
    LineBasicMaterial,
} from "three";

export class CellLine extends Line {
    public readonly material: LineBasicMaterial;

    constructor(vertices: number[][]) {
        super();

        this._makeAttributes(vertices);

        this.matrixAutoUpdate = false;
        this.updateMatrix();
        this.updateMatrixWorld(false);
    }

    public dispose(): void {
        this.geometry.dispose();
        this.material.dispose();
    }

    private _makeAttributes(vertices: number[][]): void {
        const closedPolygon = vertices.slice()
        closedPolygon.push(vertices[0]);

        let index = 0;
        const positions = new Float32Array(3 * (vertices.length + 1));
        for (const vertex of closedPolygon) {
            positions[index++] = vertex[0];
            positions[index++] = vertex[1];
            positions[index++] = vertex[2];
        }

        this.geometry.setAttribute(
            "position",
            new BufferAttribute(positions, 3));
    }
}
