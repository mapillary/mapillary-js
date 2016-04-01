/// <reference path="../../typings/browser.d.ts" />

import * as rx from "rx";

import {Camera, Transform} from "../Geo";
import {RenderCamera, RenderMode, ISize} from "../Render";
import {IFrame} from "../State";

interface IRenderCameraOperation {
    (rc: RenderCamera): RenderCamera;
}

export class RenderService {
    private _element: HTMLElement;
    private _currentFrame$: rx.Observable<IFrame>;

    private _renderCameraOperation$: rx.Subject<IRenderCameraOperation>;
    private _renderCameraFrame$: rx.Observable<RenderCamera>;
    private _renderCamera$: rx.Observable<RenderCamera>;

    private _resize$: rx.Subject<void>;
    private _size$: rx.BehaviorSubject<ISize>;

    private _renderMode$: rx.BehaviorSubject<RenderMode>;

    constructor(element: HTMLElement, currentFrame$: rx.Observable<IFrame>, renderMode: RenderMode) {
        this._element = element;
        this._currentFrame$ = currentFrame$;
        renderMode = renderMode != null ? renderMode : RenderMode.Letterbox;

        this._resize$ = new rx.Subject<void>();
        this._renderCameraOperation$ = new rx.Subject<IRenderCameraOperation>();

        this._size$ =
            new rx.BehaviorSubject<ISize>(
                {
                    height: this._element.offsetHeight,
                    width: this._element.offsetWidth,
                });

        this._renderMode$ = new rx.BehaviorSubject<RenderMode>(renderMode);

        this._resize$
            .map<ISize>(
                (): ISize => {
                    return { height: this._element.offsetHeight, width: this._element.offsetWidth };
                })
            .subscribe(this._size$);

        this._renderCameraFrame$ = this._renderCameraOperation$
            .scan<RenderCamera>(
                (rc: RenderCamera, operation: IRenderCameraOperation): RenderCamera => {
                    return operation(rc);
                },
                new RenderCamera(this._element.offsetWidth / this._element.offsetHeight, renderMode))
            .share();

        this._renderCamera$ = this._renderCameraFrame$
            .filter(
                (rc: RenderCamera): boolean => {
                    return rc.changed;
                })
            .shareReplay(1);

        this._currentFrame$
            .map<IRenderCameraOperation>(
                (frame: IFrame): IRenderCameraOperation => {
                    return (rc: RenderCamera): RenderCamera => {
                        let camera: Camera = frame.state.camera;

                        if (rc.alpha !== frame.state.alpha || rc.camera.diff(camera) > 0.00001) {
                            let currentTransform: Transform = frame.state.currentTransform;
                            let previousTransform: Transform = frame.state.previousTransform;

                            if (previousTransform == null) {
                                previousTransform = frame.state.currentTransform;
                            }

                            rc.currentAspect = currentTransform.aspect;
                            rc.currentOrientation = currentTransform.orientation;
                            rc.currentPano = frame.state.currentNode.fullPano;
                            rc.previousAspect = previousTransform.aspect;
                            rc.previousOrientation = previousTransform.orientation;
                            rc.previousPano = frame.state.previousNode != null && frame.state.previousNode.fullPano;

                            rc.alpha = frame.state.alpha;

                            rc.camera.copy(camera);
                            rc.updatePerspective(camera);

                            rc.updateProjection();
                        }

                        rc.frameId = frame.id;

                        return rc;
                    };
                })
            .subscribe(this._renderCameraOperation$);
    }

    public get element(): HTMLElement {
        return this._element;
    }

    public get resize$(): rx.Subject<void> {
        return this._resize$;
    }

    public get size$(): rx.Observable<ISize> {
        return this._size$;
    }

    public get renderMode$(): rx.Subject<RenderMode> {
        return this._renderMode$;
    }

    public get renderCameraFrame$(): rx.Observable<RenderCamera> {
        return this._renderCameraFrame$;
    }

    public get renderCamera$(): rx.Observable<RenderCamera> {
        return this._renderCamera$;
    }
}

export default RenderService;
