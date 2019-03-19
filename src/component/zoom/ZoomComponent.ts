import {combineLatest as observableCombineLatest, Subject, Subscription} from "rxjs";

import {withLatestFrom, map} from "rxjs/operators";
import * as vd from "virtual-dom";

import {
    ComponentService,
    Component,
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
import IZoomConfiguration from "../interfaces/IZoomConfiguration";
import ISize from "../../render/interfaces/ISize";
import ComponentSize from "../utils/ComponentSize";

/**
 * @class ZoomComponent
 *
 * @classdesc Component rendering UI elements used for zooming.
 *
 * @example
 * ```
 * var viewer = new Mapillary.Viewer(
 *     "<element-id>",
 *     "<client-id>",
 *     "<my key>");
 *
 * var zoomComponent = viewer.getComponent("zoom");
 * zoomComponent.configure({ size: Mapillary.ComponentSize.Small });
 * ```
 */
export class ZoomComponent extends Component<IZoomConfiguration> {
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
        this._renderSubscription = observableCombineLatest(
                this._navigator.stateService.currentState$,
                this._navigator.stateService.state$,
                this._configuration$,
                this._container.renderService.size$).pipe(
            map(
                ([frame, state, configuration, size]: [IFrame, State, IZoomConfiguration, ISize]): IVNodeHash => {
                    const zoom: number = frame.state.zoom;

                    const zoomInIcon: vd.VNode = vd.h("div.ZoomInIcon", []);
                    const zoomInButton: vd.VNode = zoom >= 3 || state === State.Waiting ?
                        vd.h("div.ZoomInButtonDisabled", [zoomInIcon]) :
                        vd.h("div.ZoomInButton", { onclick: (): void => { this._zoomDelta$.next(1); } }, [zoomInIcon]);

                    const zoomOutIcon: vd.VNode = vd.h("div.ZoomOutIcon", []);
                    const zoomOutButton: vd.VNode = zoom <= 0 || state === State.Waiting ?
                        vd.h("div.ZoomOutButtonDisabled", [zoomOutIcon]) :
                        vd.h("div.ZoomOutButton", { onclick: (): void => { this._zoomDelta$.next(-1); } }, [zoomOutIcon]);

                    const compact: string = configuration.size === ComponentSize.Small ||
                        configuration.size === ComponentSize.Automatic && size.width < 640 ?
                        ".ZoomCompact" : "";

                    return {
                        name: this._name,
                        vnode: vd.h(
                            "div.ZoomContainer" + compact,
                            { oncontextmenu: (event: MouseEvent): void => { event.preventDefault(); } },
                            [zoomInButton, zoomOutButton]),
                    };
                }))
            .subscribe(this._container.domRenderer.render$);

        this._zoomSubscription = this._zoomDelta$.pipe(
            withLatestFrom(
                this._container.renderService.renderCamera$,
                this._navigator.stateService.currentTransform$))
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

    protected _getDefaultConfiguration(): IZoomConfiguration {
        return { size: ComponentSize.Automatic };
    }
}

ComponentService.register(ZoomComponent);
export default ZoomComponent;
