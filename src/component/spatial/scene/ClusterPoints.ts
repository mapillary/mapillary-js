import {
    BufferAttribute,
    BufferGeometry,
    Points,
    PointsMaterial,
} from "three";
import { ClusterContract } from "../../../api/contracts/ClusterContract";
import { PointContract } from "../../../api/contracts/PointContract";

export class ClusterPoints extends Points {
    constructor(
        private readonly _originalSize: number,
        reconstruction: ClusterContract,
        translation: number[],
        scale: number) {
        super();

        const [positions, colors] =
            this._getArrays(reconstruction, translation);

        const geometry = new BufferGeometry();
        geometry.setAttribute(
            "position", new BufferAttribute(positions, 3));
        geometry.setAttribute(
            "color", new BufferAttribute(colors, 3));

        const material = new PointsMaterial({
            size: scale * this._originalSize,
            vertexColors: true,
        });

        this.geometry = geometry;
        this.material = material;
    }

    public dispose(): void {
        this.geometry.dispose();
        (<PointsMaterial>this.material).dispose();
    }

    public resize(scale: number): void {
        const material = <PointsMaterial>this.material;
        material.size = scale * this._originalSize;
        material.needsUpdate = true;
    }

    private _getArrays(
        reconstruction: ClusterContract,
        translation: number[])
        : [Float32Array, Float32Array] {
        const points = Object
            .keys(reconstruction.points)
            .map(
                (key: string): PointContract => {
                    return reconstruction.points[key];
                });

        const numPoints = points.length;
        const positions = new Float32Array(numPoints * 3);
        const colors = new Float32Array(numPoints * 3);
        const [translationX, translationY, translationZ] = translation;

        for (let i = 0; i < numPoints; i++) {
            const index = 3 * i;

            const [coordsX, coordsY, coordsZ] = points[i].coordinates;
            positions[index + 0] = coordsX + translationX;
            positions[index + 1] = coordsY + translationY;
            positions[index + 2] = coordsZ + translationZ;

            const color = points[i].color;
            colors[index + 0] = color[0] / 255.0;
            colors[index + 1] = color[1] / 255.0;
            colors[index + 2] = color[2] / 255.0;
        }

        return [positions, colors];
    }
}
