import {
    combineLatest as observableCombineLatest,
    empty as observableEmpty,
} from "rxjs";
import {
    first,
    pairwise,
    skip,
    switchMap,
    take,
    withLatestFrom,
} from "rxjs/operators";
import { WebGLRenderer } from "three";

import { ICustomCameraControls } from "./interfaces/ICustomCameraControls";
import { Navigator } from "./Navigator";
import { Container } from "./Container";
import { SubscriptionHolder } from "../util/SubscriptionHolder";
import { IViewer } from "./interfaces/IViewer";
import { LngLatAlt } from "../api/interfaces/LngLatAlt";
import { State } from "../state/State";
import { RenderCamera } from "../render/RenderCamera";

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
            throw new Error('Custom camera controls already attached');
        }

        const subs = this._subscriptions;

        subs.push(observableCombineLatest(
            [
                this._container.glRenderer.webGLRenderer$,
                this._container.renderService.renderCamera$,
                this._navigator.stateService.reference$,
                this._navigator.stateService.state$,
            ])
            .pipe(take(1))
            .subscribe(
                ([gl, cam, ref, state]:
                    [WebGLRenderer, RenderCamera, LngLatAlt, State]): void => {
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
                        gl.domElement,
                        projectionMatrixCallback,
                        viewMatrixCallback);

                    if (state === State.Custom) {
                        controls.onActivate(
                            viewer,
                            cam.perspective.matrixWorldInverse.toArray(),
                            ref);
                    }
                }));

        subs.push(this._navigator.stateService.state$
            .pipe(
                switchMap(
                    state => {
                        return state === State.Custom ?
                            this._navigator.stateService.currentState$ :
                            observableEmpty();

                    }))
            .subscribe(
                frame => {
                    controls.onAnimationFrame(viewer, frame.id);
                }));

        subs.push(this._navigator.stateService.state$
            .pipe(
                pairwise(),
                withLatestFrom(
                    this._navigator.stateService.reference$,
                    this._container.renderService.renderCamera$))
            .subscribe(
                ([[prev, curr], ref, cam]) => {
                    if (curr === State.Custom) {
                        controls.onActivate(
                            viewer,
                            cam.perspective.matrixWorldInverse.toArray(),
                            ref);
                    } else if (prev === State.Custom) {
                        controls.onDeactivate(viewer);
                    }
                }));

        subs.push(this._navigator.stateService.state$
            .pipe(
                switchMap(
                    state => {
                        return state === State.Custom ?
                            this._navigator.stateService.reference$
                                .pipe(skip(1)) :
                            observableEmpty();

                    }))
            .subscribe(ref => controls.onReference(viewer, ref)));

        subs.push(this._navigator.stateService.state$
            .pipe(
                switchMap(
                    state => {
                        return state === State.Custom ?
                            this._container.renderService.size$
                                .pipe(skip(1)) :
                            observableEmpty();

                    }))
            .subscribe(() => controls.onResize(viewer)));

        this._controls = controls;
    }

    public dispose(viewer: IViewer): void {
        this.detach(viewer);
    }

    public detach(viewer: IViewer): void {
        if (!this._controls) {
            return;
        }

        this._subscriptions.unsubscribe();

        this._navigator.stateService.state$
            .subscribe(state => {
                if (state === State.Custom) {
                    this._navigator.stateService.earth();
                }

                this._controls.onDeactivate(viewer);
                this._controls.onDetach(viewer);
                this._controls = null;
            });
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
