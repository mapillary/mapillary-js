/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />

import * as rx from "rx";

import {EdgeDirection} from "../Edge";
import {UI} from "../UI";
import {Container, Navigator} from "../Viewer";

interface INavigationElement {
    element: HTMLSpanElement;
    subscription: rx.IDisposable;
}

export class KeyboardUI extends UI {
    public static uiName: string = "keyboard";
    private _disposable: rx.IDisposable;

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);
    }

    protected _activate(): void {
        this._disposable = rx.Observable.fromEvent(document, "keydown").subscribe((event: KeyboardEvent): void => {
            if (event.keyCode === 40) {
                this._navigator.moveDir(EdgeDirection.STEP_BACKWARD).subscribe();
            } else if (event.keyCode === 38) {
                this._navigator.moveDir(EdgeDirection.STEP_FORWARD).subscribe();
            }
        });
    }

    protected _deactivate(): void {
        this._disposable.dispose();
    }
}

export default KeyboardUI;
