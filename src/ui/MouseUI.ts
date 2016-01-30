// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />

import * as rx from "rx";

import {UIService, UI} from "../UI";
import {Container, Navigator} from "../Viewer";

export class MouseUI extends UI {
    public static uiName: string = "mouse";

    private _mouseDragSubscription: rx.IDisposable;

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);
    }

    protected _activate(): void {
        this._container.mouseService.claimMouse(this._name, 0);
        this._mouseDragSubscription = this._container.mouseService
            .filteredMouseEvent$(this._name, this._container.mouseService.mouseDrag$)
            .subscribe((a: any): void => {
                let e: MouseEvent = a.e;
                let width: number = this._container.element.offsetWidth;
                let height: number = this._container.element.offsetHeight;

                let size: number = Math.max(width, height);

                let w: number = width / size;
                let h: number = height / size;

                let max: number = Math.PI / 2;

                let phi: number = w * max * e.movementX / size;
                let theta: number = -h * max * e.movementY / size;

                this._navigator.stateService.rotate({ phi: phi, theta: theta });
            });
    }

    protected _deactivate(): void {
        this._container.mouseService.unclaimMouse(this._name);
        this._mouseDragSubscription.dispose();
    }
}

UIService.register(MouseUI);
export default MouseUI;
