import {withLatestFrom} from "rxjs/operators";
import {Subscription} from "rxjs";

import {
    Component,
    IKeyboardConfiguration,
    HandlerBase,
} from "../../Component";
import {
    Transform,
    ViewportCoords,
} from "../../Geo";
import {RenderCamera} from "../../Render";
import {
    Container,
    Navigator,
} from "../../Viewer";

/**
 * The `KeyZoomHandler` allows the user to zoom in and out using the
 * following key commands:
 *
 * `+`: Zoom in.
 * `-`: Zoom out.
 *
 * @example
 * ```
 * var keyboardComponent = viewer.getComponent("keyboard");
 *
 * keyboardComponent.keyZoom.disable();
 * keyboardComponent.keyZoom.enable();
 *
 * var isEnabled = keyboardComponent.keyZoom.isEnabled;
 * ```
 */
export class KeyZoomHandler extends HandlerBase<IKeyboardConfiguration> {
    private _keyDownSubscription: Subscription;

    private _viewportCoords: ViewportCoords;

    /** @ignore */
    constructor(
        component: Component<IKeyboardConfiguration>,
        container: Container,
        navigator: Navigator,
        viewportCoords: ViewportCoords) {
        super(component, container, navigator);

        this._viewportCoords = viewportCoords;
    }

    protected _enable(): void {
        this._keyDownSubscription = this._container.keyboardService.keyDown$.pipe(
            withLatestFrom(
                this._container.renderService.renderCamera$,
                this._navigator.stateService.currentTransform$))
            .subscribe(
                ([event, render, transform]: [KeyboardEvent, RenderCamera, Transform]): void => {
                    if (event.altKey || event.shiftKey || event.ctrlKey || event.metaKey) {
                        return;
                    }

                    let delta: number = 0;
                    switch (event.key) {
                        case "+":
                            delta = 1;
                            break;
                        case "-":
                            delta = -1;
                            break;
                        default:
                            return;
                    }

                    event.preventDefault();

                    const unprojected: THREE.Vector3 = this._viewportCoords.unprojectFromViewport(0, 0, render.perspective);
                    const reference: number[] = transform.projectBasic(unprojected.toArray());

                    this._navigator.stateService.zoomIn(delta, reference);
                });
    }

    protected _disable(): void {
        this._keyDownSubscription.unsubscribe();
    }

    protected _getConfiguration(enable: boolean): IKeyboardConfiguration {
        return { keyZoom: enable };
    }
}

export default KeyZoomHandler;
