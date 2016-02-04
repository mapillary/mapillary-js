/// <reference path="../../typings/virtual-dom/virtual-dom.d.ts" />
/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />

import * as rx from "rx";
import * as vd from "virtual-dom";

import {EdgeDirection} from "../Edge";
import {Node} from "../Graph";
import {Container, Navigator} from "../Viewer";
import {UIService, UI} from "../UI";

import {IVNodeHash} from "../Render";

export class NavigationUI extends UI {
    public static uiName: string = "navigation";

    private _disposable: rx.IDisposable;

    private _dirNames: {[dir: number]: string};

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);

        this._dirNames = {};
        this._dirNames[EdgeDirection.STEP_FORWARD] = "Forward";
        this._dirNames[EdgeDirection.STEP_BACKWARD] = "Backward";
        this._dirNames[EdgeDirection.STEP_LEFT] = "Left";
        this._dirNames[EdgeDirection.STEP_RIGHT] = "Right";
        this._dirNames[EdgeDirection.TURN_LEFT] = "Turnleft";
        this._dirNames[EdgeDirection.TURN_RIGHT] = "Turnright";
        this._dirNames[EdgeDirection.TURN_U] = "Turnaround";
    }

    protected _activate(): void {
        this._disposable = this._navigator.stateService.currentNode$.map((node: Node): IVNodeHash => {
            let btns: vd.VNode[] = [];

            for (let edge of node.edges) {
                let direction: EdgeDirection = edge.data.direction;
                let name: string = this._dirNames[direction];
                if (name == null) {
                    continue;
                }

                btns.push(this.createVNode(direction, name));
            }

            return {name: this._name, vnode: vd.h(`div.NavigationUI`, btns)};
        }).subscribe(this._container.domRenderer.render$);
    }

    protected _deactivate(): void {
        this._disposable.dispose();
    }

    private createVNode(direction: EdgeDirection, name: string): vd.VNode {
        return vd.h(`span.btn.Direction.Direction${name}`,
                    {onclick: (ev: Event): void => { this._navigator.moveDir(direction).first().subscribe(); }},
                    []);
    }
}

UIService.register(NavigationUI);
export default NavigationUI;
