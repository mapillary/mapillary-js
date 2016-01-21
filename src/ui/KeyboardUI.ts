/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />

import * as rx from "rx";

import {EdgeDirection} from "../Edge";
import {IUI} from "../UI";
import {Container, Navigator} from "../Viewer";

interface INavigationElement {
    element: HTMLSpanElement;
    subscription: rx.IDisposable;
}

export class KeyboardUI implements IUI {
    private container: Container;
    private keySubscription: rx.IDisposable;
    private navigator: Navigator;

    constructor(container: Container, navigator: Navigator) {
        this.container = container;
        this.navigator = navigator;
    }

    public activate(): void {
        this.keySubscription = rx.Observable
            .fromEvent(document, "keydown")
            .subscribe((event: KeyboardEvent): void => {
                if (event.keyCode === 40) {
                    this.navigator.moveDir(EdgeDirection.STEP_BACKWARD).subscribe();
                } else if (event.keyCode === 38) {
                    this.navigator.moveDir(EdgeDirection.STEP_FORWARD).subscribe();
                }
            });
    }

    public deactivate(): void {
        this.keySubscription.dispose();
    }
}

export default KeyboardUI;
