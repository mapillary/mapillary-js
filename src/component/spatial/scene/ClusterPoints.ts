import {
    BufferAttribute,
    Color,
    Points,
    PointsMaterial,
} from "three";
import { ClusterContract } from "../../../api/contracts/ClusterContract";

export interface ClusterPointsParameters {
    cluster: ClusterContract;
    color: string | number;
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
        this.update();
    }

    public dispose(): void {
        this.geometry.dispose();
        this.material.dispose();
    }

    public setColor(color: string | number | null): void {
        this.material.vertexColors = color == null;
        this.material.color = new Color(color);
        this.material.needsUpdate = true;
    }

    public resize(scale: number): void {
        this.material.size = scale * this._originalSize;
        this.material.needsUpdate = true;
    }

    public update(): void {
        this.updateMatrix();
        this.updateMatrixWorld(false);
    }

    private _makeAttributes(cluster: ClusterContract): void {
        const geometry = this.geometry;

        geometry.setAttribute(
            "position",
            new BufferAttribute(
                new Float32Array(cluster.coordinates), 3));

        const colorSize = cluster.colors.length > 0 ?
            cluster.colors.length / cluster.pointIds.length : 3;
        geometry.setAttribute(
            "color",
            new BufferAttribute(new Float32Array(cluster.colors), colorSize));
    }
}
