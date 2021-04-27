import {
    BufferAttribute,
    BufferGeometry,
    Color,
    Line,
    LineBasicMaterial,
} from "three";
import { Transform } from "../../../geo/Transform";
import { OriginalPositionMode } from "../enums/OriginalPositionMode";

export class PositionLine extends Line {
    public geometry: BufferGeometry;
    public material: LineBasicMaterial;

    private _adjustedAltitude: number;
    private _originalAltitude: number;

    constructor(
        transform: Transform,
        originalPosition: number[],
        mode: OriginalPositionMode) {
        super();

        this._adjustedAltitude = transform.unprojectSfM([0, 0], 0)[2];
        this._originalAltitude = originalPosition[2];
        const altitude = this._getAltitude(mode);
        this.geometry = this._createGeometry(
            transform,
            originalPosition,
            altitude);
        this.material =
            new LineBasicMaterial({ color: new Color(1, 0, 0) });
    }

    public dispose(): void {
        this.geometry.dispose();
        this.material.dispose();
    }

    public setMode(mode: OriginalPositionMode): void {
        const positionAttribute =
            <BufferAttribute>this.geometry.attributes.position;
        const positions = <Float32Array>positionAttribute.array;

        positions[2] = this._getAltitude(mode);

        positionAttribute.needsUpdate = true;
        this.geometry.computeBoundingSphere();
    }

    private _createGeometry(
        transform: Transform,
        originalPosition: number[],
        altitude: number)
        : BufferGeometry {
        const vertices = [
            [
                originalPosition[0],
                originalPosition[1],
                altitude,
            ],
            transform.unprojectBasic([0, 0], 0)];

        const positions = new Float32Array(3 * vertices.length);
        let index = 0;
        for (const vertex of vertices) {
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

    private _getAltitude(mode: OriginalPositionMode): number {
        return mode === OriginalPositionMode.Altitude ?
            this._originalAltitude :
            this._adjustedAltitude;
    }
}
