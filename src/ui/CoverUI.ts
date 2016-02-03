/// <reference path="../../typings/virtual-dom/virtual-dom.d.ts" />

import * as rx from "rx";
import * as vd from "virtual-dom";

import {Node} from "../Graph";
import {Container, Navigator} from "../Viewer";
import {ICoverUIConfiguration, IUIConfiguration, UIService, UI} from "../UI";

import {IVNodeHash} from "../Render";

export class CoverUI extends UI {
    public static uiName: string = "cover";

    private _disposable: rx.IDisposable;
    private _keyDisposable: rx.IDisposable;

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);
    }

    public _activate(): void {
        this._keyDisposable = this._navigator.stateService.currentNode$.map((node: Node): IUIConfiguration => {
            return {key: node.key};
        }).subscribe(this._configurationSubject$);

        this._disposable = this._configuration$.map((conf: ICoverUIConfiguration): IVNodeHash => {
            if (!conf.key) {
                return {name: this._name, vnode: vd.h("div", [])};
            }
            if (!conf.visible) {
                return {name: this._name, vnode: vd.h("div.Cover.CoverDone", [ this.getCoverBackgroundVNode(conf) ])};
            }
            return {name: this._name, vnode: this.getCoverButtonVNode(conf)};
        }).subscribe(this._container.domRenderer.render$);
    }

    public _deactivate(): void {
        this._disposable.dispose();
        this._keyDisposable.dispose();
    }

    public get defaultConfiguration(): IUIConfiguration {
        return {"loading": false, "visible": true};
    }

    private getCoverButtonVNode(conf: ICoverUIConfiguration): vd.VNode {
        let coverBtn: string = "span.CoverButtonIcon";
        let children: Array<vd.VNode> = [];
        if (conf.loading) {
            coverBtn = "div.uil-ripple-css";
            children.push(vd.h("div", {}, []));
        }

        return vd.h("div.Cover", [
            this.getCoverBackgroundVNode(conf),
            vd.h("button.CoverButton", {onclick: (): void => { this.configure({loading: true}); }}, [
                vd.h(coverBtn, {}, children)
            ]),
        ]);
    }

    private getCoverBackgroundVNode(conf: ICoverUIConfiguration): vd.VNode {
        let url: string = `url(https://d1cuyjsrcm0gby.cloudfront.net/${conf.key}/thumb-320.jpg)`;
        return vd.h("div.CoverBackground", { style: { backgroundImage: url }}, []);
    }
}

UIService.registerCover(CoverUI);
export default CoverUI;
