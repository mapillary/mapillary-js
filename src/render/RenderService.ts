/// <reference path="../../typings/index.d.ts" />

import {Observable} from "rxjs/Observable";
import {Subject} from "rxjs/Subject";
import {BehaviorSubject} from "rxjs/BehaviorSubject";

import "rxjs/add/observable/combineLatest";

import "rxjs/add/operator/do";
import "rxjs/add/operator/filter";
import "rxjs/add/operator/map";
import "rxjs/add/operator/publishReplay";
import "rxjs/add/operator/scan";
import "rxjs/add/operator/skip";
import "rxjs/add/operator/startWith";
import "rxjs/add/operator/withLatestFrom";

import {Camera, Transform} from "../Geo";
import {Node} from "../Graph";
import {RenderCamera, RenderMode, ISize} from "../Render";
import {IFrame} from "../State";

interface IRenderCameraOperation {
    (rc: RenderCamera): RenderCamera;
}

export class RenderService {
    private _element: HTMLElement;
    private _currentFrame$: Observable<IFrame>;

    private _renderCameraOperation$: Subject<IRenderCameraOperation>;
    private _renderCameraHolder$: Observable<RenderCamera>;
    private _renderCameraFrame$: Observable<RenderCamera>;
    private _renderCamera$: Observable<RenderCamera>;

    private _resize$: Subject<void>;
    private _size$: BehaviorSubject<ISize>;

    private _renderMode$: BehaviorSubject<RenderMode>;

    constructor(element: HTMLElement, currentFrame$: Observable<IFrame>, renderMode: RenderMode) {
        this._element = element;
        this._currentFrame$ = currentFrame$;

        renderMode = renderMode != null ? renderMode : RenderMode.Letterbox;

        this._resize$ = new Subject<void>();
        this._renderCameraOperation$ = new Subject<IRenderCameraOperation>();

        this._size$ =
            new BehaviorSubject<ISize>(
                {
                    height: this._element.offsetHeight,
                    width: this._element.offsetWidth,
                });

        this._resize$
            .map<ISize>(
                (): ISize => {
                    return { height: this._element.offsetHeight, width: this._element.offsetWidth };
                })
            .subscribe(this._size$);

        this._renderMode$ = new BehaviorSubject<RenderMode>(renderMode);

        this._renderCameraHolder$ = this._renderCameraOperation$
            .startWith(
                (rc: RenderCamera): RenderCamera => {
                    return rc;
                })
            .scan<RenderCamera>(
                (rc: RenderCamera, operation: IRenderCameraOperation): RenderCamera => {
                    return operation(rc);
                },
                new RenderCamera(this._element.offsetWidth / this._element.offsetHeight, renderMode))
            .publishReplay(1)
            .refCount();

        this._renderCameraFrame$ = this._currentFrame$
            .withLatestFrom(
                this._renderCameraHolder$,
                (frame: IFrame, renderCamera: RenderCamera): [IFrame, RenderCamera] => {
                    return [frame, renderCamera];
                })
            .do(
                (args: [IFrame, RenderCamera]): void => {
                    let frame: IFrame = args[0];
                    let rc: RenderCamera = args[1];

                    let camera: Camera = frame.state.camera;

                    if (rc.alpha !== frame.state.alpha ||
                        rc.zoom !== frame.state.zoom ||
                        rc.camera.diff(camera) > 0.00001) {

                        let currentTransform: Transform = frame.state.currentTransform;
                        let previousTransform: Transform =
                            frame.state.previousTransform != null ?
                                frame.state.previousTransform :
                                frame.state.currentTransform;

                        let previousNode: Node =
                            frame.state.previousNode != null ?
                                frame.state.previousNode :
                                frame.state.currentNode;

                        rc.currentAspect = currentTransform.basicAspect;
                        rc.currentPano = frame.state.currentNode.pano;
                        rc.previousAspect = previousTransform.basicAspect;
                        rc.previousPano = previousNode.pano;

                        rc.alpha = frame.state.alpha;
                        rc.zoom = frame.state.zoom;

                        rc.camera.copy(camera);
                        rc.updatePerspective(camera);

                        rc.updateProjection();
                    }

                    rc.frameId = frame.id;
                })
            .map<RenderCamera>(
                (args: [IFrame, RenderCamera]): RenderCamera => {
                    return args[1];
                })
            .publishReplay(1)
            .refCount();

        this._renderCamera$ = this._renderCameraFrame$
            .filter(
                (rc: RenderCamera): boolean => {
                    return rc.changed;
                })
            .publishReplay(1)
            .refCount();

        this._size$
            .skip(1)
            .map<IRenderCameraOperation>(
                (size: ISize) => {
                    return (rc: RenderCamera): RenderCamera => {
                        rc.perspective.aspect = size.width / size.height;
                        rc.updateProjection();

                        return rc;
                    };
                })
            .subscribe(this._renderCameraOperation$);

        this._renderMode$
            .skip(1)
            .map<IRenderCameraOperation>(
                (rm: RenderMode) => {
                    return (rc: RenderCamera): RenderCamera => {
                        rc.renderMode = rm;
                        rc.updateProjection();

                        return rc;
                    };
                })
            .subscribe(this._renderCameraOperation$);

        this._renderCameraHolder$.subscribe();
        this._size$.subscribe();
        this._renderMode$.subscribe();
    }

    public get element(): HTMLElement {
        return this._element;
    }

    public get resize$(): Subject<void> {
        return this._resize$;
    }

    public get size$(): Observable<ISize> {
        return this._size$;
    }

    public get renderMode$(): Subject<RenderMode> {
        return this._renderMode$;
    }

    public get renderCameraFrame$(): Observable<RenderCamera> {
        return this._renderCameraFrame$;
    }

    public get renderCamera$(): Observable<RenderCamera> {
        return this._renderCamera$;
    }
}

export default RenderService;
