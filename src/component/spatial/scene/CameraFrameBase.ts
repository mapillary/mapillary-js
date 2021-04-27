import {
    BufferAttribute,
    BufferGeometry,
    Color,
    LineBasicMaterial,
    Object3D,
} from "three";
import { CameraFrameLine } from "./CameraFrameLine";
import { CameraFrameLineSegments } from "./CameraFrameLineSegments";

export abstract class CameraFrameBase extends Object3D {
    constructor(protected readonly _originalSize: number) {
        super();
    }

    public dispose(): void {
        for (const child of this.children) {
            const frameLine = <CameraFrameLine | CameraFrameLineSegments>child;
            frameLine.geometry.dispose();
            frameLine.material.dispose();
        }
    }

    public setColor(color: string): void {
        for (const child of this.children) {
            const frameLine = <CameraFrameLine | CameraFrameLineSegments>child;
            this._updateColorAttribute(frameLine, color);
        }
    }

    public resize(scale: number): void {
        for (const child of this.children) {
            const frameLine = <CameraFrameLine | CameraFrameLineSegments>child;
            this._updatePositionAttribute(frameLine, scale);
        }
    }

    protected _createBufferGeometry(
        positions: number[][])
        : BufferGeometry {
        const positionAttribute =
            new BufferAttribute(
                new Float32Array(3 * positions.length), 3);
        const colorAttribute =
            new BufferAttribute(
                new Float32Array(3 * positions.length), 3);
        const geometry = new BufferGeometry();
        geometry.setAttribute("position", positionAttribute);
        geometry.setAttribute("color", colorAttribute);
        return geometry;
    }

    protected _createCameraFrame(
        origin: number[],
        relativePositions: number[][],
        scale: number,
        color: string)
        : CameraFrameLine {
        const geometry = this._createBufferGeometry(relativePositions);
        const material = new LineBasicMaterial({
            vertexColors: true,
            fog: false,
        });
        const frame = new CameraFrameLine(
            geometry, material, origin, relativePositions);
        this._updatePositionAttribute(frame, scale);
        this._updateColorAttribute(frame, color);

        return frame;
    }

    protected _updateColorAttribute(
        frame: CameraFrameLine | CameraFrameLineSegments,
        color: string)
        : void {
        const [r, g, b] = new Color(color).toArray();
        const colorAttribute =
            <BufferAttribute>frame.geometry.attributes.color;
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

    protected _updateMatrixWorld(object: Object3D): void {
        object.matrixAutoUpdate = false;
        object.updateMatrixWorld(true);
        object.updateWorldMatrix(false, true);
    }

    protected _updatePositionAttribute(
        frame: CameraFrameLine | CameraFrameLineSegments,
        scale: number)
        : void {
        const positionAttribute =
            <BufferAttribute>frame.geometry.attributes.position;
        const positions = <Float32Array>positionAttribute.array;

        const originX = frame.frameOrigin[0];
        const originY = frame.frameOrigin[1];
        const originZ = frame.frameOrigin[2];

        const relativePositions = frame.relativeFramePositions;
        const length = relativePositions.length;

        let index = 0;
        for (let i = 0; i < length; i++) {
            const [deltaX, deltaY, deltaZ] = relativePositions[i];

            positions[index++] = originX + scale * deltaX;
            positions[index++] = originY + scale * deltaY;
            positions[index++] = originZ + scale * deltaZ;
        }

        positionAttribute.needsUpdate = true;

        frame.geometry.computeBoundingSphere();
    }

    protected _makeRelative(
        positions: number[][],
        origin: number[]): number[][] {
        for (const position of positions) {
            position[0] = position[0] - origin[0];
            position[1] = position[1] - origin[1];
            position[2] = position[2] - origin[2];
        }

        return positions;
    }

}
