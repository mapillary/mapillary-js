/// <reference path="../../typings/index.d.ts" />

import {
    RenderCamera,
    ISize,
} from "../Render";
import {
    Transform,
    ViewportCoords,
} from "../Geo";
import {
    IBoundingBox,
    IRegionOfInterest,
} from "../Tiles";

/**
 * @class RegionOfInterestCalculator
 *
 * @classdesc Represents a calculator for regions of interest.
 */
export class RegionOfInterestCalculator {
    private _viewportCoords: ViewportCoords = new ViewportCoords();

    /**
     * Compute a region of interest based on the current render camera
     * and the viewport size.
     *
     * @param {RenderCamera} renderCamera - Render camera used for unprojections.
     * @param {ISize} size - Viewport size in pixels.
     * @param {Transform} transform - Transform used for projections.
     *
     * @returns {IRegionOfInterest} A region of interest.
     */
    public computeRegionOfInterest(renderCamera: RenderCamera, size: ISize, transform: Transform): IRegionOfInterest {
        let canvasPoints: number[][] = this._canvasBoundaryPoints(4);
        let bbox: IBoundingBox = this._canvasPointsBoundingBox(canvasPoints, renderCamera, transform);
        this._clipBoundingBox(bbox);

        let centralPixel: number[][] = [
            [0.5 - 0.5 / size.width, 0.5 - 0.5 / size.height],
            [0.5 + 0.5 / size.width, 0.5 - 0.5 / size.height],
            [0.5 + 0.5 / size.width, 0.5 + 0.5 / size.height],
            [0.5 - 0.5 / size.width, 0.5 + 0.5 / size.height],
        ];
        let cpbox: IBoundingBox = this._canvasPointsBoundingBox(centralPixel, renderCamera, transform);

        return {
            bbox: bbox,
            pixelHeight: cpbox.maxY - cpbox.minY,
            pixelWidth: cpbox.maxX - cpbox.minX + (cpbox.minX < cpbox.maxX ? 0 : 1),
        };
    }

    private _canvasBoundaryPoints(pointsPerSide: number): number[][] {
        let points: number[][] = [];
        let os: number[][] = [[0, 0], [1, 0], [1, 1], [0, 1]];
        let ds: number[][] = [[1, 0], [0, 1], [-1, 0], [0, -1]];
        for (let side: number = 0; side < 4; ++side) {
            let o: number[] = os[side];
            let d: number[] = ds[side];
            for (let i: number = 0; i < pointsPerSide; ++i) {
                points.push([o[0] + d[0] * i / pointsPerSide,
                             o[1] + d[1] * i / pointsPerSide]);
            }
        }
        return points;
    }

    private _canvasPointsBoundingBox(canvasPoints: number[][], renderCamera: RenderCamera, transform: Transform): IBoundingBox {
        let basicPoints: number[][] = canvasPoints.map((point: number []): number[] => {
            return this._viewportCoords
                .canvasToBasic(point[0], point[1], 1, 1, transform, renderCamera.perspective);
        });

        if (transform.gpano != null) {
            return this._boundingBoxPano(basicPoints);
        } else {
            return this._boundingBox(basicPoints);
        }
    }

    private _boundingBox(points: number[][]): IBoundingBox {
        let bbox: IBoundingBox = {
            maxX: Number.NEGATIVE_INFINITY,
            maxY: Number.NEGATIVE_INFINITY,
            minX: Number.POSITIVE_INFINITY,
            minY: Number.POSITIVE_INFINITY,
        };

        for (let i: number = 0; i < points.length; ++i) {
            bbox.minX = Math.min(bbox.minX, points[i][0]);
            bbox.maxX = Math.max(bbox.maxX, points[i][0]);
            bbox.minY = Math.min(bbox.minY, points[i][1]);
            bbox.maxY = Math.max(bbox.maxY, points[i][1]);
        }

        return bbox;
    }

    private _boundingBoxPano(points: number[][]): IBoundingBox {
        let xs: number[] = [];
        let ys: number[] = [];
        for (let i: number = 0; i < points.length; ++i) {
            xs.push(points[i][0]);
            ys.push(points[i][1]);
        }
        xs.sort((a, b) => { return this._sign(a - b); });
        ys.sort((a, b) => { return this._sign(a - b); });

        let intervalX: number[] = this._intervalPano(xs);

        return {
            maxX: intervalX[1],
            maxY: ys[ys.length - 1],
            minX: intervalX[0],
            minY: ys[0],
        };
    }

    /**
     * Find the max interval between consecutive numbers.
     * Assumes numbers are between 0 and 1, sorted and that
     * x is equivalent to x + 1.
     */
    private _intervalPano(xs: number[]): number[] {
        let maxdx: number = 0;
        let maxi: number = -1;
        for (let i: number = 0; i < xs.length - 1; ++i) {
            let dx: number = xs[i + 1] - xs[i];
            if (dx > maxdx) {
                maxdx = dx;
                maxi = i;
            }
        }
        let loopdx: number = xs[0] + 1 - xs[xs.length - 1];
        if (loopdx > maxdx) {
            return [xs[0], xs[xs.length - 1]];
        } else {
            return [xs[maxi + 1], xs[maxi]];
        }
    }

    private _clipBoundingBox(bbox: IBoundingBox): void {
        bbox.minX = Math.max(0, Math.min(1, bbox.minX));
        bbox.maxX = Math.max(0, Math.min(1, bbox.maxX));
        bbox.minY = Math.max(0, Math.min(1, bbox.minY));
        bbox.maxY = Math.max(0, Math.min(1, bbox.maxY));
    }

    private _sign(n: number): number {
        return n > 0 ? 1 : n < 0 ? -1 : 0;
    }
}

export default RegionOfInterestCalculator;
