/// <reference path="../../typings/browser.d.ts" />

import * as rx from "rx";

import {Camera, Transform} from "../Geo";
import {RenderCamera, RenderMode, ISize} from "../Render";
import {IFrame} from "../State";

interface ICombination {
    alpha: number;
    camera: Camera;
    frame: IFrame;
}

interface IRenderCameraOperation {
    (rcc: [RenderCamera, boolean]): [RenderCamera, boolean];
}

export class RenderService {
    private _element: HTMLElement;
    private _currentFrame$: rx.Observable<IFrame>;

    private _renderCameraOperation$: rx.Subject<IRenderCameraOperation>;
    private _renderCamera$: rx.Observable<[RenderCamera, boolean]>;

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

        this._renderCamera$ = this._renderCameraOperation$
            .scan<[RenderCamera, boolean]>(
                (rcc: [RenderCamera, boolean], operation: IRenderCameraOperation): [RenderCamera, boolean] => {
                    return operation(rcc);
                },
                [new RenderCamera(this._element.offsetWidth / this._element.offsetHeight, renderMode), false])
            .shareReplay(1);

        this._currentFrame$
            .map<IRenderCameraOperation>(
                (frame: IFrame): IRenderCameraOperation => {
                    return (rcc: [RenderCamera, boolean]): [RenderCamera, boolean] => {
                        let rc: RenderCamera = rcc[0];

                        rc.frameId = frame.id;

                        let current: Camera = frame.state.camera;

                        if (rc.alpha !== frame.state.alpha || rc.camera.diff(current) > 0.00001) {
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

                            rc.camera.copy(current);
                            rc.updatePerspective(current);

                            rc.updateProjection();

                            return [rc, true];
                        }

                        return [rc, false];
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

    public get renderCamera$(): rx.Observable<[RenderCamera, boolean]> {
        return this._renderCamera$;
    }
}

export default RenderService;
