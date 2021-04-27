import {
    BufferGeometry,
    LineBasicMaterial,
    LineSegments,
} from "three";

export class CameraFrameLineSegments extends LineSegments {
    constructor(
        readonly geometry: BufferGeometry,
        readonly material: LineBasicMaterial,
        readonly frameOrigin: number[],
        readonly relativeFramePositions: number[][]) {
        super(geometry, material);
    }
}
