/// <reference path="../../typings/index.d.ts" />

import * as THREE from "three";

import {Observable} from "rxjs/Observable";

import {
    RenderService,
    RenderCamera,
    ISize,
} from "../Render";
import {Transform} from "../Geo";
import {
    IBoundingBox,
    IRegionOfInterest,
} from "../Tiles";

type PositionLookat = [THREE.Vector3, THREE.Vector3, number];

export class RegionOfInterestService {
    private _transform: Transform;

    private _roi$: Observable<IRegionOfInterest>;

    constructor (renderService: RenderService, transform: Transform) {
        this._transform = transform;

        this._roi$ = renderService.renderCameraFrame$
            .map(
                (renderCamera: RenderCamera): PositionLookat => {
                    return [
                        renderCamera.camera.position.clone(),
                        renderCamera.camera.lookat.clone(),
                        renderCamera.zoom.valueOf()];
                })
            .pairwise()
            .map(
                (pls: [PositionLookat, PositionLookat]): boolean => {
                    let samePosition: boolean = pls[0][0].equals(pls[1][0]);
                    let sameLookat: boolean = pls[0][1].equals(pls[1][1]);
                    let sameZoom: boolean = pls[0][2] === pls[1][2];

                    return samePosition && sameLookat && sameZoom;
                })
            .distinctUntilChanged()
            .filter(
                (stalled: boolean): boolean => {
                    return stalled;
                })
            .switchMap(
                (stalled: boolean): Observable<RenderCamera> => {
                    return renderService.renderCameraFrame$
                        .first();
                })
            .withLatestFrom<IRegionOfInterest>(
                renderService.size$,
                this._computeRegionOfInterest.bind(this));
    }

    public get roi$(): Observable<IRegionOfInterest> {
        return this._roi$;
    }

    private _computeRegionOfInterest(renderCamera: RenderCamera, size: ISize): IRegionOfInterest {
        let canvasPoints: number[][] = this._canvasBoundaryPoints(4);
        let bbox: IBoundingBox = this._canvasPointsBoundingBox(canvasPoints, renderCamera);
        this._clipBoundingBox(bbox);

        let centralPixel: number[][] = [
            [0.5 - 0.5 / size.width, 0.5 - 0.5 / size.height],
            [0.5 + 0.5 / size.width, 0.5 - 0.5 / size.height],
            [0.5 + 0.5 / size.width, 0.5 + 0.5 / size.height],
            [0.5 - 0.5 / size.width, 0.5 + 0.5 / size.height],
        ];
        let cpbox: IBoundingBox = this._canvasPointsBoundingBox(centralPixel, renderCamera);

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

    private _canvasPointsBoundingBox(canvasPoints: number[][], renderCamera: RenderCamera): IBoundingBox {
        let basicPoints: number[][] = canvasPoints.map((point: number []): number[] => {
            return this._canvasToBasic(point, renderCamera, this._transform);
        });

        if (this._transform.gpano != null) {
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
        xs.sort((a, b) => { return Math.sign(a - b); });
        ys.sort((a, b) => { return Math.sign(a - b); });

        let intervalX: number[] = this._intervalPano(xs);

        return {
            maxX: intervalX[1],
            maxY: ys[ys.length - 1],
            minX: intervalX[0],
            minY: ys[0],
        };
    }

    // find the max interval between consecutive numbers.
    // assumes numbers are between 0 and 1, sorted and
    // that x is equivalent to x + 1.
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

    private _canvasToBasic(
        point: number [],
        renderCamera: RenderCamera,
        transform: Transform): number[] {
        let bearing: THREE.Vector3 = this._unproject(point[0], point[1], renderCamera.perspective);
        return transform.projectBasic([bearing.x, bearing.y, bearing.z]);
    }

    private _unproject(
        canvasX: number,
        canvasY: number,
        perspectiveCamera: THREE.PerspectiveCamera):
        THREE.Vector3 {

        let projectedX: number = 2 * canvasX - 1;
        let projectedY: number = 1 - 2 * canvasY;

        return new THREE.Vector3(projectedX, projectedY, 1).unproject(perspectiveCamera);
    }

}

export default RegionOfInterestService;
