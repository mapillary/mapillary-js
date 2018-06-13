import {withLatestFrom, map, startWith, scan, publishReplay, skip, refCount, tap, filter} from "rxjs/operators";
import {Observable, Subject, BehaviorSubject} from "rxjs";

import {Camera, Spatial, Transform} from "../Geo";
import {Node} from "../Graph";
import {RenderCamera, RenderMode, ISize} from "../Render";
import {IFrame} from "../State";

interface IRenderCameraOperation {
    (rc: RenderCamera): RenderCamera;
}

export class RenderService {
    private _bearing$: Observable<number>;

    private _element: HTMLElement;
    private _currentFrame$: Observable<IFrame>;

    private _renderCameraOperation$: Subject<IRenderCameraOperation>;
    private _renderCameraHolder$: Observable<RenderCamera>;
    private _renderCameraFrame$: Observable<RenderCamera>;
    private _renderCamera$: Observable<RenderCamera>;

    private _resize$: Subject<void>;
    private _size$: BehaviorSubject<ISize>;

    private _spatial: Spatial;

    private _renderMode$: BehaviorSubject<RenderMode>;

    constructor(element: HTMLElement, currentFrame$: Observable<IFrame>, renderMode: RenderMode) {
        this._element = element;
        this._currentFrame$ = currentFrame$;

        this._spatial = new Spatial();

        renderMode = renderMode != null ? renderMode : RenderMode.Fill;

        this._resize$ = new Subject<void>();
        this._renderCameraOperation$ = new Subject<IRenderCameraOperation>();

        this._size$ =
            new BehaviorSubject<ISize>(
                {
                    height: this._element.offsetHeight,
                    width: this._element.offsetWidth,
                });

        this._resize$.pipe(
            map(
                (): ISize => {
                    return { height: this._element.offsetHeight, width: this._element.offsetWidth };
                }))
            .subscribe(this._size$);

        this._renderMode$ = new BehaviorSubject<RenderMode>(renderMode);

        this._renderCameraHolder$ = this._renderCameraOperation$.pipe(
            startWith(
                (rc: RenderCamera): RenderCamera => {
                    return rc;
                }),
            scan(
                (rc: RenderCamera, operation: IRenderCameraOperation): RenderCamera => {
                    return operation(rc);
                },
                new RenderCamera(this._element.offsetWidth, this._element.offsetHeight, renderMode)),
            publishReplay(1),
            refCount());

        this._renderCameraFrame$ = this._currentFrame$.pipe(
            withLatestFrom(
                this._renderCameraHolder$,
                (frame: IFrame, renderCamera: RenderCamera): [IFrame, RenderCamera] => {
                    return [frame, renderCamera];
                }),
            tap(
                (args: [IFrame, RenderCamera]): void => {
                    let frame: IFrame = args[0];
                    let rc: RenderCamera = args[1];

                    let camera: Camera = frame.state.camera;

                    if (rc.alpha !== frame.state.alpha ||
                        rc.zoom !== frame.state.zoom ||
                        rc.camera.diff(camera) > 1e-9) {

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
                        rc.updateRotation(camera);

                        rc.updateProjection();
                    }

                    rc.frameId = frame.id;
                }),
            map(
                (args: [IFrame, RenderCamera]): RenderCamera => {
                    return args[1];
                }),
            publishReplay(1),
            refCount());

        this._renderCamera$ = this._renderCameraFrame$.pipe(
            filter(
                (rc: RenderCamera): boolean => {
                    return rc.changed;
                }),
            publishReplay(1),
            refCount());

        this._bearing$ = this._renderCamera$.pipe(
            map(
                (renderCamera: RenderCamera): number => {
                    let bearing: number =
                        this._spatial.radToDeg(
                            this._spatial.azimuthalToBearing(renderCamera.rotation.phi));

                    return this._spatial.wrap(bearing, 0, 360);
                }),
            publishReplay(1),
            refCount());

        this._size$.pipe(
            skip(1),
            map(
                (size: ISize) => {
                    return (rc: RenderCamera): RenderCamera => {
                        rc.updateAspect(size.width, size.height);
                        rc.updateProjection();

                        return rc;
                    };
                }))
            .subscribe(this._renderCameraOperation$);

        this._renderMode$.pipe(
            skip(1),
            map(
                (rm: RenderMode) => {
                    return (rc: RenderCamera): RenderCamera => {
                        rc.renderMode = rm;
                        rc.updateProjection();

                        return rc;
                    };
                }))
            .subscribe(this._renderCameraOperation$);

        this._bearing$.subscribe(() => { /*noop*/ });
        this._renderCameraHolder$.subscribe(() => { /*noop*/ });
        this._size$.subscribe(() => { /*noop*/ });
        this._renderMode$.subscribe(() => { /*noop*/ });
        this._renderCamera$.subscribe(() => { /*noop*/ });
        this._renderCameraFrame$.subscribe(() => { /*noop*/ });
    }

    public get bearing$(): Observable<number> {
        return this._bearing$;
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
