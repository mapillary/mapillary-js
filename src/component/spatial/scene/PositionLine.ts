import {
    BufferAttribute,
    BufferGeometry,
    Line,
    LineBasicMaterial,
} from "three";
import { Transform } from "../../../geo/Transform";
import { OriginalPositionMode } from "../enums/OriginalPositionMode";

export interface PositionLineParameters {
    mode: OriginalPositionMode;
    originalOrigin: number[];
    transform: Transform;
    material?: LineBasicMaterial;
    geometry?: BufferGeometry;
}

export class PositionLine extends Line {
    public geometry: BufferGeometry;
    public material: LineBasicMaterial;

    private _relativeAltitude: number;

    constructor(parameters: PositionLineParameters) {
        super(parameters.geometry, parameters.material);

        const mode = parameters.mode;
        const originalOrigin = parameters.originalOrigin;
        const transform = parameters.transform;

        const origin = transform.unprojectBasic([0, 0], 0);
        this._relativeAltitude = originalOrigin[2] - origin[2];

        this._makeAttributes(origin, originalOrigin, mode);

        this.matrixAutoUpdate = false;
        this.position.fromArray(origin);
        this.updateMatrix();
        this.updateMatrixWorld(false);
    }

    public dispose(): void {
        this.geometry.dispose();
        this.material.dispose();
    }

    public setMode(mode: OriginalPositionMode): void {
        const positionAttribute =
            <BufferAttribute>this.geometry.attributes.position;
        const positions = <Float32Array>positionAttribute.array;

        positions[5] = this._modeToAltitude(mode);

        positionAttribute.needsUpdate = true;
        this.geometry.computeBoundingSphere();
    }

    private _makeAttributes(
        origin: number[],
        originalOrigin: number[],
        mode: OriginalPositionMode)
        : void {
        const positions = new Float32Array(6);
        positions[0] = 0;
        positions[1] = 0;
        positions[2] = 0;
        positions[3] = originalOrigin[0] - origin[0];
        positions[4] = originalOrigin[1] - origin[1];
        positions[5] = this._modeToAltitude(mode);

        const attribute = new BufferAttribute(positions, 3);
        this.geometry.setAttribute("position", attribute);
        attribute.needsUpdate = true;

        this.geometry.computeBoundingSphere();
    }

    private _modeToAltitude(mode: OriginalPositionMode): number {
        return mode === OriginalPositionMode.Altitude ?
            this._relativeAltitude : 0;
    }
}
