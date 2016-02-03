/// <reference path="../../typings/virtual-dom/virtual-dom.d.ts" />

import * as _ from "underscore";
import * as rx from "rx";
import * as vd from "virtual-dom";

import {IVNodeHash} from "../Render";
import {IFrame} from "../State";
import {UI, UIService} from "../UI";
import {Container, Navigator} from "../Viewer";

export class DebugUI extends UI {
    public static uiName: string = "debug";

    private _displaying: boolean;
    private _disposable: rx.IDisposable;

    private _open$: rx.BehaviorSubject<boolean> = new rx.BehaviorSubject<boolean>(false);

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);
        this._displaying = false;
    }

    public _activate(): void {
        this._disposable = this._navigator.stateService.currentState$
            .combineLatest(this._open$, this._navigator.graphService.imageLoadingService.loadstatus$,
                           (frame: IFrame, open: boolean, loadStatus: any): IVNodeHash => {
                               return {name: this._name, vnode: this._getDebugVNode(open, this._getDebugInfo(frame, loadStatus))};
                           })
            .subscribe(this._container.domRenderer.render$);
    }

    public _deactivate(): void {
        this._disposable.dispose();
    }

    private _getDebugInfo(frame: IFrame, loadStatus: any): vd.VNode[] {
        let ret: vd.VNode[] = [];

        ret.push(vd.h("h2", "Node"));

        if (frame.state.currentNode) {
            ret.push(vd.h("p", `currentNode: ${frame.state.currentNode.key}`));
        }

        if (frame.state.previousNode) {
            ret.push(vd.h("p", `previousNode: ${frame.state.previousNode.key}`));
        }

        ret.push(vd.h("h2", "Loading"));

        let total: number = 0;
        let loaded: number = 0;
        let loading: number = 0;

        for (let loadStat of _.values(loadStatus)) {
            total += loadStat.loaded;
            if (loadStat.loaded !== loadStat.total) {
                loading++;
            } else {
                loaded++;
            }
        }

        ret.push(vd.h("p", `Loaded Images: ${loaded}`));
        ret.push(vd.h("p", `Loading Images: ${loading}`));
        ret.push(vd.h("p", `Total bytes loaded: ${total}`));

        ret.push(vd.h("h2", "Camera"));

        ret.push(vd.h("p", `camera.position.x: ${frame.state.camera.position.x}`));
        ret.push(vd.h("p", `camera.position.y: ${frame.state.camera.position.y}`));
        ret.push(vd.h("p", `camera.position.z: ${frame.state.camera.position.z}`));

        ret.push(vd.h("p", `camera.lookat.x: ${frame.state.camera.lookat.x}`));
        ret.push(vd.h("p", `camera.lookat.y: ${frame.state.camera.lookat.y}`));
        ret.push(vd.h("p", `camera.lookat.z: ${frame.state.camera.lookat.z}`));

        ret.push(vd.h("p", `camera.up.x: ${frame.state.camera.up.x}`));
        ret.push(vd.h("p", `camera.up.y: ${frame.state.camera.up.y}`));
        ret.push(vd.h("p", `camera.up.z: ${frame.state.camera.up.z}`));

        return ret;
    }

    private _getDebugVNode(open: boolean, info: vd.VNode[]): vd.VNode {
        if (open) {
            return vd.h("div.Debug", {}, [
                vd.h("h2", {}, ["Debug"]),
                this._getDebugVNodeButton(open),
                vd.h("pre", {}, info),
            ]);
        } else {
            return this._getDebugVNodeButton(open);
        }
    }

    private _getDebugVNodeButton(open: boolean): any {
        let buttonText: string = open ? "Disable Debug" : "D";
        let buttonCssClass: string = open ? "" : ".DebugButtonFixed";

        if (open) {
            return vd.h(`button.DebugButton${buttonCssClass}`,
                        {onclick: this._closeDebugElement.bind(this)},
                        [buttonText]);
        } else {
            return vd.h(`button.DebugButton${buttonCssClass}`,
                        {onclick: this._openDebugElement.bind(this)},
                        [buttonText]);
        }
    }

    private _closeDebugElement(open: boolean): void {
        this._open$.onNext(false);
    }

    private _openDebugElement(): void {
        this._open$.onNext(true);
    }
}

UIService.register(DebugUI);
export default DebugUI;
