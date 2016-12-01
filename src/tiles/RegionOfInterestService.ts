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
        let epsilon: number = 1e-3;
        let canvasPairs: number[][][] = [
            [[0, 0], [0 + epsilon, 0 + epsilon]],
            [[1, 0], [1 - epsilon, 0 + epsilon]],
            [[1, 1], [1 - epsilon, 1 - epsilon]],
            [[0, 1], [0 + epsilon, 1 - epsilon]],
        ];

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

    private _boundingBox(pairs: number[][][]): IBoundingBox {
        let bbox: IBoundingBox = {
            maxX: -Number.MAX_VALUE,
            maxY: -Number.MAX_VALUE,
            minX: Number.MAX_VALUE,
            minY: Number.MAX_VALUE,
        };

        for (let i: number = 0; i < pairs.length; ++i) {
            let dx: number = pairs[i][1][0] - pairs[i][0][0];
            let dy: number = pairs[i][1][1] - pairs[i][0][1];
            if (dx > 0) {
                bbox.minX = Math.min(bbox.minX, pairs[i][0][0]);
            } else {
                bbox.maxX = Math.max(bbox.maxX, pairs[i][0][0]);
            }
            if (dy > 0) {
                bbox.minY = Math.min(bbox.minY, pairs[i][0][1]);
            } else {
                bbox.maxY = Math.max(bbox.maxY, pairs[i][0][1]);
            }
        }

        bbox.minX = Math.max(0, bbox.minX);
        bbox.maxX = Math.min(1, bbox.maxX);
        bbox.minY = Math.max(0, bbox.minY);
        bbox.maxY = Math.min(1, bbox.maxY);

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
