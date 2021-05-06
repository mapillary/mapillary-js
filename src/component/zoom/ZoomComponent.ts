import * as vd from "virtual-dom";

import {
    combineLatest as observableCombineLatest,
    Subject,
    Subscription,
} from "rxjs";

import {
    map,
    withLatestFrom,
} from "rxjs/operators";

import { Component } from "../Component";
import { ZoomConfiguration } from "../interfaces/ZoomConfiguration";

import { Transform } from "../../geo/Transform";
import { ViewportCoords } from "../../geo/ViewportCoords";
import { RenderCamera } from "../../render/RenderCamera";
import { ViewportSize } from "../../render/interfaces/ViewportSize";
import { VirtualNodeHash } from "../../render/interfaces/VirtualNodeHash";
import { State } from "../../state/State";
import { AnimationFrame } from "../../state/interfaces/AnimationFrame";
import { ComponentSize } from "../util/ComponentSize";
import { Container } from "../../viewer/Container";
import { Navigator } from "../../viewer/Navigator";
import { ComponentName } from "../ComponentName";

/**
 * @class ZoomComponent
 *
 * @classdesc Component rendering UI elements used for zooming.
 *
 * @example
 * ```js
 * var viewer = new Viewer({ ... });
 *
 * var zoomComponent = viewer.getComponent("zoom");
 * zoomComponent.configure({ size: ComponentSize.Small });
 * ```
 */
export class ZoomComponent extends Component<ZoomConfiguration> {
    public static componentName: ComponentName = "zoom";

    private _viewportCoords: ViewportCoords;

    private _zoomDelta$: Subject<number>;

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);

        this._viewportCoords = new ViewportCoords();

        this._zoomDelta$ = new Subject<number>();
    }

    protected _activate(): void {
        const subs = this._subscriptions;

        subs.push(observableCombineLatest(
            this._navigator.stateService.currentState$,
            this._navigator.stateService.state$,
            this._configuration$,
            this._container.renderService.size$).pipe(
                map(
                    ([frame, state, configuration, size]: [AnimationFrame, State, ZoomConfiguration, ViewportSize]): VirtualNodeHash => {
                        const zoom: number = frame.state.zoom;

                        const zoomInIcon: vd.VNode = vd.h("div.mapillary-zoom-in-icon", []);
                        const zoomInButton: vd.VNode = zoom >= 3 || state === State.Waiting ?
                            vd.h("div.mapillary-zoom-in-button-inactive", [zoomInIcon]) :
                            vd.h("div.mapillary-zoom-in-button", { onclick: (): void => { this._zoomDelta$.next(1); } }, [zoomInIcon]);

                        const zoomOutIcon: vd.VNode = vd.h("div.mapillary-zoom-out-icon", []);
                        const zoomOutButton: vd.VNode = zoom <= 0 || state === State.Waiting ?
                            vd.h("div.mapillary-zoom-out-button-inactive", [zoomOutIcon]) :
                            vd.h("div.mapillary-zoom-out-button", { onclick: (): void => { this._zoomDelta$.next(-1); } }, [zoomOutIcon]);

                        const compact: string = configuration.size === ComponentSize.Small ||
                            configuration.size === ComponentSize.Automatic && size.width < 640 ?
                            ".mapillary-zoom-compact" : "";

                        return {
                            name: this._name,
                            vNode: vd.h(
                                "div.mapillary-zoom-container" + compact,
                                { oncontextmenu: (event: MouseEvent): void => { event.preventDefault(); } },
                                [zoomInButton, zoomOutButton]),
                        };
                    }))
            .subscribe(this._container.domRenderer.render$));

        subs.push(this._zoomDelta$.pipe(
            withLatestFrom(
                this._container.renderService.renderCamera$,
                this._navigator.stateService.currentTransform$))
            .subscribe(
                ([zoomDelta, render, transform]: [number, RenderCamera, Transform]): void => {
                    const unprojected: THREE.Vector3 = this._viewportCoords.unprojectFromViewport(0, 0, render.perspective);
                    const reference: number[] = transform.projectBasic(unprojected.toArray());

                    this._navigator.stateService.zoomIn(zoomDelta, reference);
                }));
    }

    protected _deactivate(): void {
        this._subscriptions.unsubscribe();
    }

    protected _getDefaultConfiguration(): ZoomConfiguration {
        return { size: ComponentSize.Automatic };
    }
}
