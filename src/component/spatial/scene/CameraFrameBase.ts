import {
    BufferAttribute,
    BufferGeometry,
    Color,
    LineSegments,
    Material,
} from "three";
import { Transform } from "../../../geo/Transform";

export interface CameraFrameParameters {
    color: string;
    geometry?: BufferGeometry;
    material?: Material;
    scale: number;
    size: number;
    transform: Transform;
}

export abstract class CameraFrameBase extends LineSegments {
    public readonly material: Material;

    constructor(parameters: CameraFrameParameters) {
        super(parameters.geometry, parameters.material);

        const color = parameters.color;
        const size = parameters.size;
        const scale = parameters.scale;
        const transform = parameters.transform;

        const origin = transform.unprojectBasic([0, 0], 0);
        const positions = this._makePositions(size, transform, origin);

        this._makeAttributes(positions, color);

        this.geometry.computeBoundingSphere();
        this.geometry.computeBoundingBox();

        this.matrixAutoUpdate = false;
        this.position.fromArray(origin);
        this.scale.set(scale, scale, scale);
        this.updateMatrix();
        this.updateMatrixWorld(false);
    }

    public dispose(): void {
        this.geometry.dispose();
        this.material.dispose();
    }

    public setColor(color: string): CameraFrameBase {
        this._updateColorAttribute(color);
        return this;
    }

    public resize(scale: number): CameraFrameBase {
        this.scale.set(scale, scale, scale);
        this.updateMatrix();
        this.updateMatrixWorld(false);
        return this;
    }

    protected abstract _makePositions(
        size: number,
        transform: Transform,
        origin: number[])
        : number[];

    protected _makeAttributes(positions: number[], color: string): void {
        const geometry = this.geometry;

        const positionAttribute =
            new BufferAttribute(
                new Float32Array(positions), 3);
        geometry.setAttribute("position", positionAttribute);
        positionAttribute.needsUpdate = true;

        const colorAttribute =
            new BufferAttribute(
                new Float32Array(positions.length), 3);
        geometry.setAttribute("color", colorAttribute);
        this._updateColorAttribute(color);
    }

    protected _updateColorAttribute(color: string): void {
        const [r, g, b] = new Color(color).toArray();
        const colorAttribute =
            <BufferAttribute>this.geometry.attributes.color;
        const colors = <Float32Array>colorAttribute.array;
        const length = colors.length;

        let index = 0;
        for (let i = 0; i < length; i++) {
            colors[index++] = r;
            colors[index++] = g;
            colors[index++] = b;
        }
        colorAttribute.needsUpdate = true;
    }
}
