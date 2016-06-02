/// <reference path="../../../../typings/index.d.ts" />

import {VertexGeometry} from "../../../Component";
import {Transform} from "../../../Geo";

export class PolygonGeometry extends VertexGeometry {
    private _vertices2d: number[][];

    constructor(vertices2d: number[][]) {
        super();

        this._vertices2d = [];
        for (let vertex2d of vertices2d) {
            this._vertices2d.push(vertex2d.slice());
        }
    }

    public setVertex2d(index: number, value: number[], transform: Transform): void {
        if (index === 0 || index === this._vertices2d.length - 1) {
            this._vertices2d[0] = value.slice();
            this._vertices2d[this._vertices2d.length - 1] = value.slice();
        } else {
            this._vertices2d[index] = value.slice();
        }

        this._notifyChanged$.onNext(this);
    }

    public setCentroid2d(value: number[], transform: Transform): void {
        let xs: number[] = this._vertices2d.map((point: number[]): number => { return point[0]; });
        let ys: number[] = this._vertices2d.map((point: number[]): number => { return point[1]; });

        let minX: number = Math.min.apply(Math, xs);
        let maxX: number = Math.max.apply(Math, xs);
        let minY: number = Math.min.apply(Math, ys);
        let maxY: number = Math.max.apply(Math, ys);

        let centroid: number[] = this._getCentroid2d();

        let minTranslationX: number = -minX;
        let maxTranslationX: number = 1 - maxX;
        let minTranslationY: number = -minY;
        let maxTranslationY: number = 1 - maxY;

        let translationX: number = Math.max(minTranslationX, Math.min(maxTranslationX, value[0] - centroid[0]));
        let translationY: number = Math.max(minTranslationY, Math.min(maxTranslationY, value[1] - centroid[1]));

        for (let point of this._vertices2d) {
            point[0] += translationX;
            point[1] += translationY;
        }

        this._notifyChanged$.onNext(this);
    }

    public getPoints3d(transform: Transform): number[][] {
        return this.getVertices3d(transform);
    }

    public getVertices3d(transform: Transform): number[][] {
        return this._vertices2d
            .map(
                (point: number[]) => {
                    return transform.unprojectBasic(point, 200);
                });
    }

    public getCentroid3d(transform: Transform): number[] {
        let centroid2d: number[] = this._getCentroid2d();

        return transform.unprojectBasic(centroid2d, 200);
    }

    private _getCentroid2d(): number[] {
        let polygon: number[][] = this._vertices2d;

        let area: number = 0;
        let centroidX: number = 0;
        let centroidY: number = 0;

        for (let i: number = 0; i < polygon.length - 1; i++) {
            let xi: number = polygon[i][0];
            let yi: number = polygon[i][1];
            let xi1: number = polygon[i + 1][0];
            let yi1: number = polygon[i + 1][1];

            let a: number = xi * yi1 - xi1 * yi;

            area += a;
            centroidX += (xi + xi1) * a;
            centroidY += (yi + yi1) * a;
        }

        area /= 2;

        centroidX /= 6 * area;
        centroidY /= 6 * area;

        return [centroidX, centroidY];
    }
}

export default PolygonGeometry;
