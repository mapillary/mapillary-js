/// <reference path="../../../../typings/browser.d.ts" />

import {Geometry} from "../../../Component";
import {Transform} from "../../../Geo";

export class PolygonGeometry extends Geometry {
    private _polygonPoints2d: number[][];

    constructor(polygonPoints2d: number[][]) {
        super();

        this._polygonPoints2d = [];
        for (let polygonPoint2d of polygonPoints2d) {
            this._polygonPoints2d.push(polygonPoint2d.slice());
        }
    }

    public setPolygonPoint2d(index: number, value: number[]): void {
        if (index === 0 || index === this._polygonPoints2d.length - 1) {
            this._polygonPoints2d[0] = value.slice();
            this._polygonPoints2d[this._polygonPoints2d.length - 1] = value.slice();
        } else {
            this._polygonPoints2d[index] = value.slice();
        }

        this._notifyChanged$.onNext(this);
    }

    public setCentroid2d(value: number[], transform: Transform): void {
        let xs: number[] = this._polygonPoints2d.map((point: number[]): number => { return point[0]; });
        let ys: number[] = this._polygonPoints2d.map((point: number[]): number => { return point[1]; });

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

        for (let point of this._polygonPoints2d) {
            point[0] += translationX;
            point[1] += translationY;
        }

        this._notifyChanged$.onNext(this);
    }

    public getPolygon3d(transform: Transform): number[][] {
        return this.getPolygonPoints3d(transform);
    }

    public getPolygonPoints3d(transform: Transform): number[][] {
        return this._polygonPoints2d
            .map(
                (point: number[]) => {
                    return transform.unprojectBasic(point, 200);
                });
    }

    public getCentroidPoint3d(transform: Transform): number[] {
        let centroid2d: number[] = this._getCentroid2d();

        return transform.unprojectBasic(centroid2d, 200);
    }

    private _getCentroid2d(): number[] {
        let polygon: number[][] = this._polygonPoints2d;

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
