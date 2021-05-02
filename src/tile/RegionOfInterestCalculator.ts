import { TileBoundingBox } from "./interfaces/TileBoundingBox";
import { TileRegionOfInterest } from "./interfaces/TileRegionOfInterest";

import { Transform } from "../geo/Transform";
import { ViewportCoords } from "../geo/ViewportCoords";
import { RenderCamera } from "../render/RenderCamera";
import { ViewportSize } from "../render/interfaces/ViewportSize";
import { isSpherical } from "../geo/Geo";

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
     * @param {ViewportSize} size - Viewport size in pixels.
     * @param {Transform} transform - Transform used for projections.
     *
     * @returns {TileRegionOfInterest} A region of interest.
     */
    public computeRegionOfInterest(
        renderCamera: RenderCamera,
        size: ViewportSize,
        transform: Transform): TileRegionOfInterest {

        const viewportBoundaryPoints = this._viewportBoundaryPoints(4);
        const bbox = this._viewportPointsBoundingBox(
            viewportBoundaryPoints,
            renderCamera,
            transform);

        this._clipBoundingBox(bbox);

        const viewportPixelWidth = 2 / size.width;
        const viewportPixelHeight = 2 / size.height;
        const centralViewportPixel = [
            [-0.5 * viewportPixelWidth, 0.5 * viewportPixelHeight],
            [0.5 * viewportPixelWidth, 0.5 * viewportPixelHeight],
            [0.5 * viewportPixelWidth, -0.5 * viewportPixelHeight],
            [-0.5 * viewportPixelWidth, -0.5 * viewportPixelHeight],
        ];
        const cpbox =
            this._viewportPointsBoundingBox(
                centralViewportPixel,
                renderCamera,
                transform);
        const inverted = cpbox.minX < cpbox.maxX;

        return {
            bbox: bbox,
            pixelHeight: cpbox.maxY - cpbox.minY,
            pixelWidth: cpbox.maxX - cpbox.minX + (inverted ? 0 : 1),
        };
    }

    private _viewportBoundaryPoints(pointsPerSide: number): number[][] {
        const points: number[][] = [];
        const os = [[-1, 1], [1, 1], [1, -1], [-1, -1]];
        const ds = [[2, 0], [0, -2], [-2, 0], [0, 2]];
        for (let side = 0; side < 4; ++side) {
            const o = os[side];
            const d = ds[side];
            for (let i = 0; i < pointsPerSide; ++i) {
                points.push([o[0] + d[0] * i / pointsPerSide,
                o[1] + d[1] * i / pointsPerSide]);
            }
        }
        return points;
    }

    private _viewportPointsBoundingBox(
        viewportPoints: number[][],
        renderCamera: RenderCamera,
        transform: Transform): TileBoundingBox {

        const basicPoints = viewportPoints
            .map(
                (point: number[]): number[] => {
                    return this._viewportCoords
                        .viewportToBasic(
                            point[0],
                            point[1],
                            transform,
                            renderCamera.perspective);
                });

        if (isSpherical(transform.cameraType)) {
            return this._boundingBoxSpherical(basicPoints);
        } else {
            return this._boundingBox(basicPoints);
        }
    }

    private _boundingBox(points: number[][]): TileBoundingBox {
        const bbox: TileBoundingBox = {
            maxX: Number.NEGATIVE_INFINITY,
            maxY: Number.NEGATIVE_INFINITY,
            minX: Number.POSITIVE_INFINITY,
            minY: Number.POSITIVE_INFINITY,
        };

        for (let i = 0; i < points.length; ++i) {
            bbox.minX = Math.min(bbox.minX, points[i][0]);
            bbox.maxX = Math.max(bbox.maxX, points[i][0]);
            bbox.minY = Math.min(bbox.minY, points[i][1]);
            bbox.maxY = Math.max(bbox.maxY, points[i][1]);
        }

        return bbox;
    }

    private _boundingBoxSpherical(points: number[][]): TileBoundingBox {
        const xs: number[] = [];
        const ys: number[] = [];
        for (let i = 0; i < points.length; ++i) {
            xs.push(points[i][0]);
            ys.push(points[i][1]);
        }
        xs.sort((a, b) => { return this._sign(a - b); });
        ys.sort((a, b) => { return this._sign(a - b); });

        const intervalX = this._intervalSpherical(xs);

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
    private _intervalSpherical(xs: number[]): number[] {
        let maxdx = 0;
        let maxi = -1;
        for (let i = 0; i < xs.length - 1; ++i) {
            const dx = xs[i + 1] - xs[i];
            if (dx > maxdx) {
                maxdx = dx;
                maxi = i;
            }
        }
        const loopdx = xs[0] + 1 - xs[xs.length - 1];
        if (loopdx > maxdx) {
            return [xs[0], xs[xs.length - 1]];
        } else {
            return [xs[maxi + 1], xs[maxi]];
        }
    }

    private _clipBoundingBox(bbox: TileBoundingBox): void {
        bbox.minX = Math.max(0, Math.min(1, bbox.minX));
        bbox.maxX = Math.max(0, Math.min(1, bbox.maxX));
        bbox.minY = Math.max(0, Math.min(1, bbox.minY));
        bbox.maxY = Math.max(0, Math.min(1, bbox.maxY));
    }

    private _sign(n: number): number {
        return n > 0 ? 1 : n < 0 ? -1 : 0;
    }
}
