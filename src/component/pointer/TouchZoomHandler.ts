import * as THREE from "three";

import {
    merge as observableMerge,
    Observable,
    Subscription,
} from "rxjs";

import {
    filter,
    map,
    withLatestFrom,
} from "rxjs/operators";

import { Transform } from "../../geo/Transform";
import { ViewportCoords } from "../../geo/ViewportCoords";
import { RenderCamera } from "../../render/RenderCamera";
import { IAnimationState } from "../../state/interfaces/IAnimationState";
import { AnimationFrame } from "../../state/interfaces/AnimationFrame";
import { Container } from "../../viewer/Container";
import { Navigator } from "../../viewer/Navigator";
import { TouchPinch } from "../../viewer/interfaces/TouchPinch";
import { Component } from "../Component";
import { PointerConfiguration } from "../interfaces/PointerConfiguration";
import { HandlerBase } from "../util/HandlerBase";
import { isSpherical } from "../../geo/Geo";

/**
 * The `TouchZoomHandler` allows the user to zoom the viewer image by pinching on a touchscreen.
 *
 * @example
 * ```js
 * var pointerComponent = viewer.getComponent("pointer");
 *
 * pointerComponent.touchZoom.disable();
 * pointerComponent.touchZoom.enable();
 *
 * var isEnabled = pointerComponent.touchZoom.isEnabled;
 * ```
 */
export class TouchZoomHandler extends HandlerBase<PointerConfiguration> {
    private _viewportCoords: ViewportCoords;

    private _activeSubscription: Subscription;
    private _preventDefaultSubscription: Subscription;
    private _zoomSubscription: Subscription;

    /** @ignore */
    constructor(
        component: Component<PointerConfiguration>,
        container: Container,
        navigator: Navigator,
        viewportCoords: ViewportCoords) {
        super(component, container, navigator);

        this._viewportCoords = viewportCoords;
    }

    protected _enable(): void {
        this._preventDefaultSubscription = this._container.touchService.pinch$
            .subscribe(
                (pinch: TouchPinch): void => {
                    pinch.originalEvent.preventDefault();
                });

        let pinchStarted$: Observable<boolean> =
            this._container.touchService.pinchStart$.pipe(
                map(
                    (event: TouchEvent): boolean => {
                        return true;
                    }));

        let pinchStopped$: Observable<boolean> =
            this._container.touchService.pinchEnd$.pipe(
                map(
                    (event: TouchEvent): boolean => {
                        return false;
                    }));

        this._activeSubscription = observableMerge(
            pinchStarted$,
            pinchStopped$)
            .subscribe(this._container.touchService.activate$);

        this._zoomSubscription = this._container.touchService.pinch$.pipe(
            withLatestFrom(this._navigator.stateService.currentState$),
            filter(
                (args: [TouchPinch, AnimationFrame]): boolean => {
                    let state: IAnimationState = args[1].state;
                    return isSpherical(state.currentImage.cameraType) ||
                        state.imagesAhead < 1;
                }),
            map(
                (args: [TouchPinch, AnimationFrame]): TouchPinch => {
                    return args[0];
                }),
            withLatestFrom(
                this._container.renderService.renderCamera$,
                this._navigator.stateService.currentTransform$))
            .subscribe(
                ([pinch, render, transform]: [TouchPinch, RenderCamera, Transform]): void => {
                    let element: HTMLElement = this._container.container;

                    let [canvasX, canvasY]: number[] = this._viewportCoords.canvasPosition(pinch, element);

                    let unprojected: THREE.Vector3 =
                        this._viewportCoords.unprojectFromCanvas(
                            canvasX,
                            canvasY,
                            element,
                            render.perspective);

                    let reference: number[] = transform.projectBasic(unprojected.toArray());

                    const [canvasWidth, canvasHeight]: number[] = this._viewportCoords.containerToCanvas(element);
                    let zoom: number = 3 * pinch.distanceChange / Math.min(canvasWidth, canvasHeight);

                    this._navigator.stateService.zoomIn(zoom, reference);
                });
    }

    protected _disable(): void {
        this._activeSubscription.unsubscribe();
        this._preventDefaultSubscription.unsubscribe();
        this._zoomSubscription.unsubscribe();

        this._preventDefaultSubscription = null;
        this._zoomSubscription = null;
    }

    protected _getConfiguration(enable: boolean): PointerConfiguration {
        return { touchZoom: enable };
    }
}
