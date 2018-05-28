/// <reference path="../../../typings/index.d.ts" />

import * as vd from "virtual-dom";

import {Observable} from "rxjs/Observable";
import {Subject} from "rxjs/Subject";
import {Subscription} from "rxjs/Subscription";

import {
    ComponentService,
    Component,
    IComponentConfiguration,
} from "../../Component";
import {
    Transform,
    ViewportCoords,
} from "../../Geo";
import {
    IVNodeHash,
    RenderCamera,
} from "../../Render";
import {
    IFrame,
    State,
} from "../../State";
import {
    Container,
    Navigator,
} from "../../Viewer";

export class ZoomComponent extends Component<IComponentConfiguration> {
    public static componentName: string = "zoom";

    private _viewportCoords: ViewportCoords;

    private _zoomDelta$: Subject<number>;

    private _renderSubscription: Subscription;
    private _zoomSubscription: Subscription;

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);

        this._viewportCoords = new ViewportCoords();

        this._zoomDelta$ = new Subject<number>();
    }

    protected _activate(): void {
        this._renderSubscription = Observable
            .combineLatest(
                this._navigator.stateService.currentState$,
                this._navigator.stateService.state$)
            .map(
                ([frame, state]: [IFrame, State]): [number, State] => {
                    return [frame.state.zoom, state];
                })
            .map(
                ([zoom, state]: [number, State]): IVNodeHash => {
                    const zoomInIcon: vd.VNode = vd.h("div.ZoomInIcon", []);
                    const zoomInButton: vd.VNode = zoom >= 3 || state === State.Waiting ?
                        vd.h("div.ZoomInButtonDisabled", [zoomInIcon]) :
                        vd.h("div.ZoomInButton", { onclick: (): void => { this._zoomDelta$.next(1); } }, [zoomInIcon]);

                    const zoomOutIcon: vd.VNode = vd.h("div.ZoomOutIcon", []);
                    const zoomOutButton: vd.VNode = zoom <= 0 || state === State.Waiting ?
                        vd.h("div.ZoomOutButtonDisabled", [zoomOutIcon]) :
                        vd.h("div.ZoomOutButton", { onclick: (): void => { this._zoomDelta$.next(-1); } }, [zoomOutIcon]);

                    return {
                        name: this._name,
                        vnode: vd.h(
                            "div.ZoomContainer",
                            { oncontextmenu: (event: MouseEvent): void => { event.preventDefault(); } },
                            [zoomInButton, zoomOutButton]),
                    };
                })
            .subscribe(this._container.domRenderer.render$);

        this._zoomSubscription = this._zoomDelta$
            .withLatestFrom(
                this._container.renderService.renderCamera$,
                this._navigator.stateService.currentTransform$)
            .subscribe(
                ([zoomDelta, render, transform]: [number, RenderCamera, Transform]): void => {
                    const unprojected: THREE.Vector3 = this._viewportCoords.unprojectFromViewport(0, 0, render.perspective);
                    const reference: number[] = transform.projectBasic(unprojected.toArray());

                    this._navigator.stateService.zoomIn(zoomDelta, reference);
                });
    }

    protected _deactivate(): void {
        this._renderSubscription.unsubscribe();
        this._zoomSubscription.unsubscribe();
    }

    protected _getDefaultConfiguration(): IComponentConfiguration {
        return {};
    }
}

ComponentService.register(ZoomComponent);
export default ZoomComponent;
