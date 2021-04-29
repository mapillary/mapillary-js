import {
    BufferAttribute,
    Points,
    PointsMaterial,
} from "three";
import { ClusterContract } from "../../../api/contracts/ClusterContract";

export interface ClusterPointsParameters {
    cluster: ClusterContract;
    originalSize: number;
    scale: number;
    translation: number[];
}

export class ClusterPoints extends Points {
    public readonly material: PointsMaterial;

    private readonly _originalSize: number;

    constructor(parameters: ClusterPointsParameters) {
        super();

        this._originalSize = parameters.originalSize;
        const cluster = parameters.cluster;
        const scale = parameters.scale;
        const translation = parameters.translation;

        this._makeAttributes(cluster);
        this.material.size = scale * this._originalSize;
        this.material.vertexColors = true;
        this.material.needsUpdate = true;

        this.matrixAutoUpdate = false;
        this.position.fromArray(translation);
        this.updateMatrix();
        this.updateMatrixWorld(false);
    }

    public dispose(): void {
        this.geometry.dispose();
        this.material.dispose();
    }

    public resize(scale: number): void {
        this.material.size = scale * this._originalSize;
        this.material.needsUpdate = true;
    }

    private _makeAttributes(cluster: ClusterContract): void {
        const positions: number[] = [];
        const colors: number[] = [];
        const normalize = 1 / 255;

        const points = cluster.points;
        for (const pointId in points) {
            if (!points.hasOwnProperty(pointId)) {
                continue;
            }

            const point = points[pointId]
            positions.push(...point.coordinates)

            const color = point.color;
            colors.push(normalize * color[0]);
            colors.push(normalize * color[1]);
            colors.push(normalize * color[2]);
        }

        const geometry = this.geometry;
        geometry.setAttribute(
            "position",
            new BufferAttribute(new Float32Array(positions), 3));
        geometry.setAttribute(
            "color",
            new BufferAttribute(new Float32Array(colors), 3));
    }
}
