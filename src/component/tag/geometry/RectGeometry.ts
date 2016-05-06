/// <reference path="../../../../typings/browser.d.ts" />

import {Geometry} from "../../../Component";
import {Transform} from "../../../Geo";

export class RectGeometry extends Geometry {
    private _rect: number[];

    constructor(rect: number[]) {
        super();

        this._rect = rect.slice();
    }

    public setPolygonPoint2d(index: number, value: number[]): void {
        let original: number[] = this._rect.slice();

        let newCoord: number[] = [
            Math.max(0, Math.min(1, value[0])),
            Math.max(0, Math.min(1, value[1])),
        ];

        let rect: number[] = [];
        if (index === 0) {
            rect[0] = newCoord[0];
            rect[1] = original[1];
            rect[2] = original[2];
            rect[3] = newCoord[1];
        } else if (index === 1) {
            rect[0] = newCoord[0];
            rect[1] = newCoord[1];
            rect[2] = original[2];
            rect[3] = original[3];
        } else if (index === 2) {
            rect[0] = original[0];
            rect[1] = newCoord[1];
            rect[2] = newCoord[0];
            rect[3] = original[3];
        } else if (index === 3) {
            rect[0] = original[0];
            rect[1] = original[1];
            rect[2] = newCoord[0];
            rect[3] = newCoord[1];
        }

        if (rect[0] > rect[2]) {
            rect[0] = original[0];
            rect[2] = original[2];
        }

        if (rect[1] > rect[3]) {
            rect[1] = original[1];
            rect[3] = original[3];
        }

        this._rect[0] = rect[0];
        this._rect[1] = rect[1];
        this._rect[2] = rect[2];
        this._rect[3] = rect[3];

        this._notifyChanged$.onNext(this);
    }

    public setCentroid2d(value: number[]): void {
        let original: number[] = this._rect.slice();

        let centerX: number = original[0] + (original[2] - original[0]) / 2;
        let centerY: number = original[1] + (original[3] - original[1]) / 2;

        let minTranslationX: number = -original[0];
        let maxTranslationX: number = 1 - original[2];
        let minTranslationY: number = -original[1];
        let maxTranslationY: number = 1 - original[3];

        let translationX: number = Math.max(minTranslationX, Math.min(maxTranslationX, value[0] - centerX));
        let translationY: number = Math.max(minTranslationY, Math.min(maxTranslationY, value[1] - centerY));

        this._rect[0] = original[0] + translationX;
        this._rect[1] = original[1] + translationY;
        this._rect[2] = original[2] + translationX;
        this._rect[3] = original[3] + translationY;

        this._notifyChanged$.onNext(this);
    }

    public getPolygon3d(transform: Transform): number[][] {
        let polygonPoints2d: number[][] = this._rectToPolygonPoints2d(this._rect);

        let sides: number = polygonPoints2d.length - 1;
        let sections: number = 10;

        let polygon2d: number[][] = [];

        for (let i: number = 0; i < sides; ++i) {
            let startX: number = polygonPoints2d[i][0];
            let startY: number = polygonPoints2d[i][1];

            let endX: number = polygonPoints2d[i + 1][0];
            let endY: number = polygonPoints2d[i + 1][1];

            let intervalX: number = (endX - startX) / (sections - 1);
            let intervalY: number = (endY - startY) / (sections - 1);

            for (let j: number = 0; j < sections; ++j) {
                let point: number[] = [
                    startX + j * intervalX,
                    startY + j * intervalY,
                ];

                polygon2d.push(point);
            }
        }

        return polygon2d
            .map(
                (point: number[]) => {
                    return transform.unprojectBasic(point, 200);
                });
    }

    public getPolygonPoints3d(transform: Transform): number[][] {
        return this._rectToPolygonPoints2d(this._rect)
            .map(
                (point: number[]) => {
                    return transform.unprojectBasic(point, 200);
                });
    }

    public getCentroidPoint3d(transform: Transform): number[] {
        let rect: number[] = this._rect;

        let centroidX: number = rect[0] + (rect[2] - rect[0]) / 2;
        let centroidY: number = rect[1] + (rect[3] - rect[1]) / 2;

        return transform.unprojectBasic([centroidX, centroidY], 200);
    }

    private _rectToPolygonPoints2d(rect: number[]): number[][] {
        return [
            [rect[0], rect[3]],
            [rect[0], rect[1]],
            [rect[2], rect[1]],
            [rect[2], rect[3]],
            [rect[0], rect[3]],
        ];
    }
}

export default RectGeometry;
