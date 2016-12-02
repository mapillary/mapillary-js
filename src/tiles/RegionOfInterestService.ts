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


export class RegionOfInterestService {
    private _transform: Transform;

    private _roi$: Observable<IRegionOfInterest>;

    constructor (
        renderSerive: RenderService,
        transform: Transform) {

        this._transform = transform;

        this._roi$ = renderSerive.renderCamera$
            .withLatestFrom<IRegionOfInterest>(
                renderSerive.size$,
                this._computeRegionOfInterest.bind(this));
    }

    public get roi$(): Observable<IRegionOfInterest> {
        return this._roi$;
    }

    private _computeRegionOfInterest(renderCamera: RenderCamera, size: ISize): IRegionOfInterest {
        let canvasPairs: number[][][] = this._canvasBoundaryPairs(4);

        let basicPairs: number[][][] = canvasPairs.map((pair: number [][]): number[][] => {
            return [
                this._canvasToBasic(pair[0], renderCamera, this._transform),
                this._canvasToBasic(pair[1], renderCamera, this._transform),
            ];
        });

        let bbox: IBoundingBox = this._boundingBox(basicPairs);

        return {
            bbox: bbox,
            viewportHeight: size.height,
            viewportWidth: size.width,
        };
    }

    private _canvasBoundaryPairs(pointsPerSide: number): number[][][] {
        let epsilon: number = 1e-3;
        let pairs: number[][][] = [];
        let os: number[][] = [[0, 0], [1, 0], [1, 1], [0, 1]];
        let ds: number[][] = [[1, 0], [0, 1], [-1, 0], [0, -1]];
        for (let side: number = 0; side < 4; ++side) {
            let o: number[] = os[side];
            let d: number[] = ds[side];
            for (let i: number = 0; i < pointsPerSide; ++i) {
                let p1: number[] = [o[0] + d[0] * i / pointsPerSide,
                                    o[1] + d[1] * i / pointsPerSide];
                let p2: number[] = [p1[0] + (0.5 - p1[0]) * epsilon,
                                    p1[1] + (0.5 - p1[1]) * epsilon];
                pairs.push([p1, p2]);
            }
        }
        return pairs;
    }

    private _boundingBox(pairs: number[][][]): IBoundingBox {
        let bbox: IBoundingBox = {
            maxX: Number.NEGATIVE_INFINITY,
            maxY: Number.NEGATIVE_INFINITY,
            minX: Number.POSITIVE_INFINITY,
            minY: Number.POSITIVE_INFINITY,
        };

        for (let i: number = 0; i < pairs.length; ++i) {
            let dx: number = pairs[i][1][0] - pairs[i][0][0];
            let dy: number = pairs[i][1][1] - pairs[i][0][1];
            if (dx > 0) {
                bbox.minX = Math.min(bbox.minX, pairs[i][0][0]);
            } else if (dx < 0) {
                bbox.maxX = Math.max(bbox.maxX, pairs[i][0][0]);
            }
            if (dy > 0) {
                bbox.minY = Math.min(bbox.minY, pairs[i][0][1]);
            } else if (dy < 0) {
                bbox.maxY = Math.max(bbox.maxY, pairs[i][0][1]);
            }
        }

        // handle unbounded sides
        if (bbox.minX === Number.POSITIVE_INFINITY) { bbox.minX = 0; }
        if (bbox.maxX === Number.NEGATIVE_INFINITY) { bbox.maxX = 1; }
        if (bbox.minY === Number.POSITIVE_INFINITY) { bbox.minY = 0; }
        if (bbox.maxY === Number.NEGATIVE_INFINITY) { bbox.maxY = 1; }

        // clip to [0, 1]
        bbox.minX = Math.max(0, Math.min(1, bbox.minX));
        bbox.maxX = Math.max(0, Math.min(1, bbox.maxX));
        bbox.minY = Math.max(0, Math.min(1, bbox.minY));
        bbox.maxY = Math.max(0, Math.min(1, bbox.maxY));

        return bbox;
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
