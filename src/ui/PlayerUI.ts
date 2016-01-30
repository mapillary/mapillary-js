/// <reference path="../../typings/virtual-dom/virtual-dom.d.ts" />

import * as rx from "rx";
import * as vd from "virtual-dom";

import {IVNodeHash} from "../Render";
import {IFrame} from "../State";
import {UIService, UI} from "../UI";
import {Container, Navigator} from "../Viewer";

export class PlayerUI extends UI {
    public static uiName: string = "player";
    private _disposable: rx.IDisposable;

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);
    }

    public _activate(): void {
        this._disposable = this._navigator.stateService.currentState$.subscribe((frame: IFrame): IVNodeHash => {
            return {name: this._name, vnode: vd.h("div", [])};
        });
    }

    public _deactivate(): void {
        this._disposable.dispose();
    }

    public play(): void {
        return;
    }

    public stop(): void {
        return;
    }
}

UIService.register(PlayerUI);
export default PlayerUI;
