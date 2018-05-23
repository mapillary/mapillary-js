/// <reference path="../../../typings/index.d.ts" />

import * as vd from "virtual-dom";

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
        this._renderSubscription = this._navigator.stateService.currentState$
            .map(
                (frame: IFrame): number => {
                    return frame.state.zoom;
                })
            .map(
                (zoom: number): IVNodeHash => {
                    const zoomInButton: vd.VNode = zoom >= 3 ?
                        vd.h("div.ZoomInButtonDisabled", []) :
                        vd.h("div.ZoomInButton", { onclick: (): void => { this._zoomDelta$.next(1); } }, []);

                    const zoomOutButton: vd.VNode = zoom <= 0 ?
                        vd.h("div.ZoomOutButtonDisabled", []) :
                        vd.h("div.ZoomOutButton", { onclick: (): void => { this._zoomDelta$.next(-1); } }, []);

                    return {
                        name: this._name,
                        vnode: vd.h("div.ZoomContainer", {}, [zoomInButton, zoomOutButton]),
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
