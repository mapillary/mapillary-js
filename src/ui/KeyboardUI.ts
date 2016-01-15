/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />

import * as rx from "rx";

import {EdgeConstants} from "../Edge";
import {IUI} from "../UI";
import {Container, Navigator} from "../Viewer";

interface INavigationElement {
    element: HTMLSpanElement;
    subscription: rx.IDisposable;
}

export class KeyboardUI implements IUI {
    private container: Container;
    private disposable: rx.IDisposable;
    private navigator: Navigator;

    constructor(container: Container, navigator: Navigator) {
        this.container = container;
        this.navigator = navigator;
    }

    public activate(): void {
        rx.Observable.fromEvent(document, "keydown").subscribe((event: KeyboardEvent): void => {
            if (event.keyCode === 40) {
                this.navigator.moveDir(EdgeConstants.EdgeDirection.STEP_BACKWARD).subscribe();
            } else if (event.keyCode === 38) {
                this.navigator.moveDir(EdgeConstants.EdgeDirection.STEP_FORWARD).subscribe();
            }
        });
    }

    public deactivate(): void {
        this.disposable.dispose();
    }
}

export default KeyboardUI;
