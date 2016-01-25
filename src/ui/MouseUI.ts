// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />

import * as rx from "rx";

import {UI} from "../UI";
import {Container, Navigator} from "../Viewer";

export class MouseUI extends UI {
    public static uiName: string = "mouse";

    private _mouseDragSubscription: rx.IDisposable;

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);
    }

    protected _activate(): void {
        this._mouseDragSubscription = this._container.mouseService.mouseDrag$
            .subscribe((e: MouseEvent): void => {
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
        this._mouseDragSubscription.dispose();
    }
}

export default MouseUI;
