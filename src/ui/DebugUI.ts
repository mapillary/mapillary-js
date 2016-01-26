/// <reference path="../../typings/virtual-dom/virtual-dom.d.ts" />

import * as vd from "virtual-dom";

import {Container, Navigator} from "../Viewer";
import {UI} from "../UI";

export class DebugUI extends UI {
    public static uiName: string = "debug";
    private _key: string;

    private _displaying: boolean;

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);
        this._displaying = false;
    }

    public configure(options: any): void {
        this._key = options.key;
    }

    public _activate(): void {
        this._container.domRenderer.render$.onNext({name: "debug", vnode: this._getDebugVNode()});
    }

    public _deactivate(): void {
        this._container.domRenderer
            .render$
            .onNext({name: "debug", vnode:  this._getDebugVNodeButton()});
    }

    private _getDebugVNode(): any {
        if (this._displaying) {
            return vd.h("div.Debug", {}, [
                vd.h("h2", {}, ["Debug"]),
                this._getDebugVNodeButton(),
                vd.h("pre", {}, ["More debug goes here"]),
            ]);
        } else {
            return this._getDebugVNodeButton();
        }

    }

    private _getDebugVNodeButton(): any {
        let buttonText: string = this._displaying ? "Disable Debug" : "Debug";
        let buttonCssClass: string = this._displaying ? "" : ".DebugButtonFixed";
        return vd.h(`button.DebugButton${buttonCssClass}`,
                    {
                        onclick: this._toggleDebugElement.bind(this)
                    },
                    [buttonText]);
    }

    private _toggleDebugElement(): void {
        this._displaying = !this._displaying;

        if (this._displaying) {
            this._activate();
        } else {
            this._deactivate();
        }

    }
}

export default DebugUI;
