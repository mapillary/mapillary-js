/// <reference path="../../../typings/index.d.ts" />

import * as THREE from "three";

import {Observable} from "rxjs/Observable";
import {Subscription} from "rxjs/Subscription";

import {
    IMouseConfiguration,
    MouseHandlerBase,
} from "../../Component";
import {Transform} from "../../Geo";
import {RenderCamera} from "../../Render";
import {
    ICurrentState,
    IFrame,
} from "../../State";
import {IPinch} from "../../Viewer";

export class TouchZoomHandler extends MouseHandlerBase<IMouseConfiguration> {
    private _activeSubscription: Subscription;
    private _preventDefaultSubscription: Subscription;
    private _zoomSubscription: Subscription;

    protected _enable(): void {
        this._preventDefaultSubscription = this._container.touchService.pinch$
            .subscribe(
                (pinch: IPinch): void => {
                    pinch.originalEvent.preventDefault();
                });

        let pinchStarted$: Observable<boolean> =
            this._container.touchService.pinchStart$
                .map(
                    (event: TouchEvent): boolean => {
                        return true;
                    });

        let pinchStopped$: Observable<boolean> =
            this._container.touchService.pinchEnd$
                .map(
                    (event: TouchEvent): boolean => {
                        return false;
                    });

        this._activeSubscription = Observable
            .merge(
                pinchStarted$,
                pinchStopped$)
            .subscribe(this._container.touchService.activate$);

        this._zoomSubscription = this._container.touchService.pinch$
            .withLatestFrom(this._navigator.stateService.currentState$)
            .filter(
                (args: [IPinch, IFrame]): boolean => {
                    let state: ICurrentState = args[1].state;
                    return state.currentNode.fullPano || state.nodesAhead < 1;
                })
            .map(
                (args: [IPinch, IFrame]): IPinch => {
                    return args[0];
                })
            .withLatestFrom(
                this._container.renderService.renderCamera$,
                this._navigator.stateService.currentTransform$)
            .subscribe(
                ([pinch, render, transform]: [IPinch, RenderCamera, Transform]): void => {
                    let element: HTMLElement = this._container.element;

                    let canvasWidth: number = element.offsetWidth;
                    let canvasHeight: number = element.offsetHeight;

                    let [canvasX, canvasY]: number[] = this._viewportCoords.canvasPosition(pinch, element);

                    let unprojected: THREE.Vector3 =
                        this._viewportCoords.unprojectFromCanvas(
                            canvasX,
                            canvasY,
                            canvasWidth,
                            canvasHeight,
                            render.perspective);

                    let reference: number[] = transform.projectBasic(unprojected.toArray());

                    let zoom: number = 3 * pinch.distanceChange / Math.min(canvasHeight, canvasWidth);

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

    protected _getConfiguration(enable: boolean): IMouseConfiguration {
        return { touchZoom: enable };
    }
}

export default TouchZoomHandler;
