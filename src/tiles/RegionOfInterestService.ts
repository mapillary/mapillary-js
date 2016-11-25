import {Observable} from "rxjs/Observable";
import {Subscription} from "rxjs/Subscription";

import {
    RenderService,
    RenderCamera,
    ISize,
} from "../Render";
import {Transform} from "../Geo";
import {TextureProvider} from "../Tiles";


interface IBoundingBox {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
}


interface IRegionOfInterest {
    bbox: IBoundingBox;
    viewportHeight: number;
    viewportWidth: number;
}


export class RegionOfInterestService {
    private _transform: Transform;

    private _roiObservable$: Observable<IRegionOfInterest>;
    private _textureRoiSubscription: Subscription;

    constructor (
        renderSerive: RenderService,
        transform: Transform,
        textureProvider: TextureProvider) {

        this._transform = transform;

        this._roiObservable$ = renderSerive.renderCamera$
            .withLatestFrom<IRegionOfInterest>(renderSerive.size$,
                                               this._computeRegionOfInterest);

        this._textureRoiSubscription = this._roiObservable$.subscribe(/* textureProvider.XXX */);
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
            maxX: 999999,
            maxY: -999999,
            minX: 999999,
            minY: -999999,
        };
        for (let i: number = 0; i < points.length; ++i) {
            bbox.minX = Math.min(bbox.minX, points[i][0]);
            bbox.minY = Math.min(bbox.minY, points[i][1]);
            bbox.maxX = Math.max(bbox.maxX, points[i][0]);
            bbox.maxY = Math.max(bbox.maxY, points[i][1]);
        }
        return bbox;
    };

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
        offsetWidth: number,
        offsetHeight: number,
        perspectiveCamera: THREE.PerspectiveCamera):
        THREE.Vector3 {

        let projectedX: number = 2 * canvasX / offsetWidth - 1;
        let projectedY: number = 1 - 2 * canvasY / offsetHeight;

        return new THREE.Vector3(projectedX, projectedY, 1).unproject(perspectiveCamera);
    }

}

export default RegionOfInterestService;
