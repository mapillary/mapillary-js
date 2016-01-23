// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />

import * as rx from "rx";

import {IUI} from "../UI";
import {Container, Navigator} from "../Viewer";

export class MouseUI implements IUI {
    private _container: Container;
    private _navigator: Navigator;

    private _mouseDragSubscription: rx.IDisposable;

    constructor(container: Container, navigator: Navigator) {
        this._container = container;
        this._navigator = navigator;
    }

    public activate(): void {
        this._mouseDragSubscription = this._container.mouseService.mouseDrag$
            .subscribe((e: MouseEvent): void => {
                let width: number = this._container.element.offsetWidth;
                let height: number = this._container.element.offsetHeight;

                let size: number = Math.max(width, height);
                let max: number = Math.PI / 2;

                let phi: number = max * e.movementX / size;
                let theta: number = -max * e.movementY / size;

                this._navigator.stateService.rotate({ phi: phi, theta: theta });
            });
    }

    public deactivate(): void {
        this._mouseDragSubscription.dispose();
    }
}

export default MouseUI;
