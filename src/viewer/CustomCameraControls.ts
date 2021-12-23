import {
    combineLatest as observableCombineLatest,
    empty as observableEmpty,
    Subject,
} from "rxjs";
import {
    distinctUntilChanged,
    first,
    map,
    pairwise,
    skip,
    startWith,
    switchMap,
    take,
    withLatestFrom,
} from "rxjs/operators";

import { ICustomCameraControls } from "./interfaces/ICustomCameraControls";
import { Navigator } from "./Navigator";
import { Container } from "./Container";
import { SubscriptionHolder } from "../util/SubscriptionHolder";
import { IViewer } from "./interfaces/IViewer";
import { State } from "../state/State";
import { MapillaryError } from "../error/MapillaryError";

export class CustomCameraControls {
    private _controls: ICustomCameraControls;
    private _subscriptions: SubscriptionHolder;

    constructor(
        private _container: Container,
        private _navigator: Navigator) {
        this._controls = null;
        this._subscriptions = new SubscriptionHolder();
    }

    public attach(controls: ICustomCameraControls, viewer: IViewer): void {
        if (this._controls) {
            throw new MapillaryError('Custom camera controls already attached');
        }

        this._controls = controls;

        const attach$ = new Subject<void>();
        const active$ = attach$
            .pipe(
                switchMap(
                    () => {
                        return this._navigator.stateService.state$;
                    }),
                map(
                    (state: State): boolean => {
                        return state === State.Custom;
                    }),
                distinctUntilChanged());

        const subs = this._subscriptions;
        subs.push(active$
            .pipe(
                startWith(false),
                pairwise(),
                withLatestFrom(
                    this._navigator.stateService.reference$,
                    this._container.renderService.renderCamera$))
            .subscribe(
                ([[deactivate, activate], ref, cam]) => {
                    if (activate) {
                        controls.onActivate(
                            viewer,
                            cam.perspective.matrixWorldInverse.toArray(),
                            cam.perspective.projectionMatrix.toArray(),
                            ref);
                    } else if (deactivate) {
                        controls.onDeactivate(viewer);
                    }
                }));

        subs.push(active$
            .pipe(
                switchMap(
                    active => {
                        return active ?
                            this._navigator.stateService.currentState$
                                .pipe(skip(1)) :
                            observableEmpty();

                    }))
            .subscribe(
                frame => {
                    controls.onAnimationFrame(viewer, frame.id);
                }));

        subs.push(active$
            .pipe(
                switchMap(
                    active => {
                        return active ?
                            this._navigator.stateService.reference$
                                .pipe(skip(1)) :
                            observableEmpty();

                    }))
            .subscribe(ref => controls.onReference(viewer, ref)));

        subs.push(active$
            .pipe(
                switchMap(
                    active => {
                        return active ?
                            this._container.renderService.size$
                                .pipe(skip(1)) :
                            observableEmpty();

                    }))
            .subscribe(() => controls.onResize(viewer)));

        subs.push(
            observableCombineLatest(
                [
                    // Include to ensure GL renderer has been initialized
                    this._container.glRenderer.webGLRenderer$,
                    this._container.renderService.renderCamera$,
                    this._navigator.stateService.reference$,
                    this._navigator.stateService.state$,
                ])
                .pipe(first())
                .subscribe(
                    (): void => {
                        const projectionMatrixCallback =
                            (projectionMatrix: number[]) => {
                                if (!this._controls ||
                                    controls !== this._controls) {
                                    return;
                                }
                                this._updateProjectionMatrix(projectionMatrix);
                            };
                        const viewMatrixCallback =
                            (viewMatrix: number[]) => {
                                if (!this._controls ||
                                    controls !== this._controls) {
                                    return;
                                }
                                this._updateViewMatrix(viewMatrix);
                            };

                        controls.onAttach(
                            viewer,
                            viewMatrixCallback,
                            projectionMatrixCallback);

                        attach$.next();
                        attach$.complete();
                    }));
    }

    public detach(viewer: IViewer): Promise<ICustomCameraControls> {
        const controls = this._controls;
        this._controls = null;

        this._subscriptions.unsubscribe();

        return new Promise(resolve => {
            this._navigator.stateService.state$
                .pipe(take(1))
                .subscribe(state => {
                    if (!controls) {
                        resolve(null);
                        return;
                    }

                    if (state === State.Custom) {
                        controls.onDeactivate(viewer);
                    }

                    controls.onDetach(viewer);
                    resolve(controls);
                });
        });
    }

    public dispose(viewer: IViewer): void {
        this.detach(viewer);
    }

    public has(controls: ICustomCameraControls): boolean {
        return !!this._controls && controls === this._controls;
    }

    private _updateProjectionMatrix(projectionMatrix: number[]): void {
        this._navigator.stateService.state$
            .pipe(first())
            .subscribe(
                state => {
                    if (state !== State.Custom) {
                        const message =
                            "Incorrect camera control mode for " +
                            "projection matrix update";
                        console.warn(message);
                        return;
                    }
                    this._container.renderService.projectionMatrix$
                        .next(projectionMatrix);
                });
    }

    private _updateViewMatrix(viewMatrix: number[]): void {
        this._navigator.stateService.state$
            .pipe(first())
            .subscribe(
                state => {
                    if (state !== State.Custom) {
                        const message =
                            "Incorrect camera control mode for " +
                            "view matrix update";
                        console.warn(message);
                        return;
                    }
                    this._navigator.stateService.setViewMatrix(viewMatrix);
                });
    }
}
