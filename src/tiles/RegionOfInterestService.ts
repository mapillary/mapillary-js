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
        let canvasPoints: number[][] = [
            [0, 0],
            [size.width, 0],
            [size.width, size.height],
            [0, size.height],
        ];

        let basicPoints: number[][] = canvasPoints.map((point: number []): number[] => {
            return this._canvasToBasic(point, size, renderCamera, this._transform);
        });

        // todo(pau): This will not work for panoramas
        let bbox: IBoundingBox = this._boundingBox(basicPoints);

        return {
            bbox: bbox,
            viewportHeight: size.height,
            viewportWidth: size.width,
        };
    }

    private _boundingBox(points: number[][]): IBoundingBox {
        let bbox: IBoundingBox = {
            maxX: -Number.MAX_VALUE,
            maxY: -Number.MAX_VALUE,
            minX: Number.MAX_VALUE,
            minY: Number.MAX_VALUE,
        };

        for (let i: number = 0; i < points.length; ++i) {
            bbox.minX = Math.min(bbox.minX, points[i][0]);
            bbox.minY = Math.min(bbox.minY, points[i][1]);
            bbox.maxX = Math.max(bbox.maxX, points[i][0]);
            bbox.maxY = Math.max(bbox.maxY, points[i][1]);
        }

        bbox.minX = Math.max(0, bbox.minX);
        bbox.maxX = Math.min(1, bbox.maxX);
        bbox.minY = Math.max(0, bbox.minY);
        bbox.maxY = Math.min(1, bbox.maxY);

        return bbox;
    }

    private _canvasToBasic(
        point: number [],
        size: ISize,
        renderCamera: RenderCamera,
        transform: Transform): number[] {
        let bearing: THREE.Vector3 = this._unproject(point[0], point[1], size.width, size.height, renderCamera.perspective);
        return transform.projectBasic([bearing.x, bearing.y, bearing.z]);
    }

    private _unproject(
        canvasX: number,
        canvasY: number,
        canvasWidth: number,
        canvasHeight: number,
        perspectiveCamera: THREE.PerspectiveCamera):
        THREE.Vector3 {

        let projectedX: number = 2 * canvasX / canvasWidth - 1;
        let projectedY: number = 1 - 2 * canvasY / canvasHeight;

        return new THREE.Vector3(projectedX, projectedY, 1).unproject(perspectiveCamera);
    }

}

export default RegionOfInterestService;
