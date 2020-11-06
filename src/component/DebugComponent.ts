import { combineLatest as observableCombineLatest, BehaviorSubject, Subscription } from "rxjs";
import { map } from "rxjs/operators";
import * as vd from "virtual-dom";

import { Component, ComponentService, IComponentConfiguration } from "../Component";
import { IVNodeHash } from "../Render";
import { IFrame } from "../State";

export class DebugComponent extends Component<IComponentConfiguration> {
    public static componentName: string = "debug";

    private _disposable: Subscription;

    private _open$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

    public _activate(): void {
        this._disposable = observableCombineLatest(
            this._navigator.stateService.currentState$,
            this._open$).pipe(
                map(
                    ([frame, open]: [IFrame, boolean]): IVNodeHash => {
                        return { name: this._name, vnode: this._getDebugVNode(open, this._getDebugInfo(frame)) };
                    }))
            .subscribe(this._container.domRenderer.render$);
    }

    public _deactivate(): void {
        this._disposable.unsubscribe();
    }

    protected _getDefaultConfiguration(): IComponentConfiguration {
        return {};
    }

    private _getDebugInfo(frame: IFrame): vd.VNode[] {
        let ret: vd.VNode[] = [];

        ret.push(vd.h("h2", "Node"));

        if (frame.state.currentNode) {
            ret.push(vd.h("p", `currentNode: ${frame.state.currentNode.key}`));
        }

        if (frame.state.previousNode) {
            ret.push(vd.h("p", `previousNode: ${frame.state.previousNode.key}`));
        }

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
            return vd.h(
                `button.DebugButton${buttonCssClass}`,
                { onclick: this._closeDebugElement.bind(this) },
                [buttonText]);
        } else {
            return vd.h(
                `button.DebugButton${buttonCssClass}`,
                { onclick: this._openDebugElement.bind(this) },
                [buttonText]);
        }
    }

    private _closeDebugElement(): void {
        this._open$.next(false);
    }

    private _openDebugElement(): void {
        this._open$.next(true);
    }
}

ComponentService.register(DebugComponent);
export default DebugComponent;
