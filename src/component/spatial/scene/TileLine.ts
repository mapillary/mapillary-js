import {
    BufferAttribute,
    BufferGeometry,
    Line,
    LineBasicMaterial,
    Material,
} from "three";

export class TileLine extends Line {
    constructor(vertices: number[][]) {
        super();
        this.geometry = this._createGeometry(vertices);
        this.material = new LineBasicMaterial();
    }

    public dispose(): void {
        this.geometry.dispose();
        (<Material>this.material).dispose();
    }

    private _createGeometry(vertices: number[][]): BufferGeometry {
        const polygon = vertices.slice()
        polygon.push(vertices[0]);
        const positions = new Float32Array(3 * (vertices.length + 1));
        let index = 0;
        for (const vertex of polygon) {
            positions[index++] = vertex[0];
            positions[index++] = vertex[1];
            positions[index++] = vertex[2];
        }

        const geometry = new BufferGeometry();
        geometry.setAttribute(
            "position",
            new BufferAttribute(positions, 3));

        return geometry;
    }
}
