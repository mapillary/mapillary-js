import {
    BufferAttribute,
    Color,
    Points,
    PointsMaterial,
} from "three";
import { ClusterContract } from "../../../api/contracts/ClusterContract";

export interface ClusterPointsParameters {
    cluster: ClusterContract;
    color: string;
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

        const { cluster, color, scale, translation } = parameters;

        this._makeAttributes(cluster);
        this.material.size = scale * this._originalSize;
        this.setColor(color);

        this.matrixAutoUpdate = false;
        this.position.fromArray(translation);
        this.updateMatrix();
        this.updateMatrixWorld(false);
    }

    public dispose(): void {
        this.geometry.dispose();
        this.material.dispose();
    }

    public setColor(color?: string): void {
        this.material.vertexColors = color == null;
        this.material.color = new Color(color);
        this.material.needsUpdate = true;
    }

    public resize(scale: number): void {
        this.material.size = scale * this._originalSize;
        this.material.needsUpdate = true;
    }

    private _makeAttributes(cluster: ClusterContract): void {
        const positions: number[] = [];
        const colors: number[] = [];

        const points = cluster.points;
        for (const pointId in points) {
            if (!points.hasOwnProperty(pointId)) {
                continue;
            }

            const point = points[pointId];
            positions.push(...point.coordinates);

            const color = point.color;
            colors.push(color[0]);
            colors.push(color[1]);
            colors.push(color[2]);
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
