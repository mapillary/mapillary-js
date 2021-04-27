import {
    BufferGeometry,
    Line,
    LineBasicMaterial,
} from "three";

export class CameraFrameLine extends Line {
    constructor(
        readonly geometry: BufferGeometry,
        readonly material: LineBasicMaterial,
        readonly frameOrigin: number[],
        readonly relativeFramePositions: number[][]) {
        super(geometry, material);
    }
}
