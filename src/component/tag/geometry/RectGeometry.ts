/// <reference path="../../../../typings/browser.d.ts" />

import {Geometry, GeometryTagError} from "../../../Component";
import {Transform} from "../../../Geo";

export class RectGeometry extends Geometry {
    private _rect: number[];

    private _inverted: boolean;

    constructor(rect: number[]) {
        super();

        if (rect[1] > rect[3]) {
            throw new GeometryTagError("Basic Y coordinate values can not be inverted.");
        }

        for (let coord of rect) {
            if (coord < 0 || coord > 1) {
                throw new GeometryTagError("Basic coordinates must be on the interval [0, 1].");
            }
        }

        this._rect = rect.slice(0, 4);

        if (this._rect[0] > this._rect[2]) {
            this._inverted = true;
        }
    }

    public get rect(): number[] {
        return this._rect;
    }

    public setPolygonPoint2d(index: number, value: number[], transform: Transform): void {
        let original: number[] = this._rect.slice();

        let changed: number[] = [
            Math.max(0, Math.min(1, value[0])),
            Math.max(0, Math.min(1, value[1])),
        ];

        let rect: number[] = [];
        if (index === 0) {
            rect[0] = changed[0];
            rect[1] = original[1];
            rect[2] = original[2];
            rect[3] = changed[1];
        } else if (index === 1) {
            rect[0] = changed[0];
            rect[1] = changed[1];
            rect[2] = original[2];
            rect[3] = original[3];
        } else if (index === 2) {
            rect[0] = original[0];
            rect[1] = changed[1];
            rect[2] = changed[0];
            rect[3] = original[3];
        } else if (index === 3) {
            rect[0] = original[0];
            rect[1] = original[1];
            rect[2] = changed[0];
            rect[3] = changed[1];
        }

        if (transform.gpano) {
            let passingBoundaryLeft: boolean =
                index < 2 && changed[0] > 0.75 && original[0] < 0.25 ||
                index >= 2 && this._inverted && changed[0] > 0.75 && original[2] < 0.25;

            let passingBoundaryRight: boolean =
                index < 2 && this._inverted && changed[0] < 0.25 && original[0] > 0.75 ||
                index >= 2 && changed[0] < 0.25 && original[2] > 0.75;

            if (passingBoundaryLeft || passingBoundaryRight) {
                this._inverted = !this._inverted;
            } else {
                if (rect[0] - original[0] < -0.25) {
                    rect[0] = original[0];
                }

                if (rect[2] - original[2] > 0.25) {
                    rect[2] = original[2];
                }
            }

            if (!this._inverted && rect[0] > rect[2] ||
                this._inverted && rect[0] < rect[2]) {
                rect[0] = original[0];
                rect[2] = original[2];
            }
        } else {
             if (rect[0] > rect[2]) {
                rect[0] = original[0];
                rect[2] = original[2];
            }
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

    public setCentroid2d(value: number[], transform: Transform): void {
        let original: number[] = this._rect.slice();

        let x0: number = original[0];
        let x1: number = this._inverted ? original[2] + 1 : original[2];

        let y0: number = original[1];
        let y1: number = original[3];

        let centerX: number = x0 + (x1 - x0) / 2;
        let centerY: number = y0 + (y1 - y0) / 2;

        let translationX: number = 0;

        if (transform.gpano) {
            translationX = this._inverted ? value[0] + 1 - centerX : value[0] - centerX;
        } else {
            let minTranslationX: number = -x0;
            let maxTranslationX: number = 1 - x1;

            translationX = Math.max(minTranslationX, Math.min(maxTranslationX, value[0] - centerX));
        }

        let minTranslationY: number = -y0;
        let maxTranslationY: number = 1 - y1;

        let translationY: number = Math.max(minTranslationY, Math.min(maxTranslationY, value[1] - centerY));

        this._rect[0] = original[0] + translationX;
        this._rect[1] = original[1] + translationY;
        this._rect[2] = original[2] + translationX;
        this._rect[3] = original[3] + translationY;

        if (this._rect[0] < 0) {
            this._rect[0] += 1;
            this._inverted = !this._inverted;
        } else if (this._rect[0] > 1) {
            this._rect[0] -= 1;
            this._inverted = !this._inverted;
        }

        if (this._rect[2] < 0) {
            this._rect[2] += 1;
            this._inverted = !this._inverted;
        } else if (this._rect[2] > 1) {
            this._rect[2] -= 1;
            this._inverted = !this._inverted;
        }

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

        let x0: number = rect[0];
        let x1: number = this._inverted ? rect[2] + 1 : rect[2];

        let y0: number = rect[1];
        let y1: number = rect[3];

        let centroidX: number = x0 + (x1 - x0) / 2;
        let centroidY: number = y0 + (y1 - y0) / 2;

        return transform.unprojectBasic([centroidX, centroidY], 200);
    }

    public validate(bottomRight: number[]): boolean {
        let rect: number[] = this._rect;

        if (!this._inverted && bottomRight[0] < rect[0] ||
            bottomRight[0] - rect[2] > 0.25 ||
            bottomRight[1] < rect[1]) {
            return false;
        }

        return true;
    }

    private _rectToPolygonPoints2d(rect: number[]): number[][] {
        return [
            [rect[0], rect[3]],
            [rect[0], rect[1]],
            [this._inverted ? rect[2] + 1 : rect[2], rect[1]],
            [this._inverted ? rect[2] + 1 : rect[2], rect[3]],
            [rect[0], rect[3]],
        ];
    }
}

export default RectGeometry;
