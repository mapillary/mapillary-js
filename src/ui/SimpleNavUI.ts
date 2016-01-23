/// <reference path="../../typings/virtual-dom/virtual-dom.d.ts" />
/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />

import * as rx from "rx";
import * as vd from "virtual-dom";

import {EdgeDirection} from "../Edge";
import {UI} from "../UI";
import {Node} from "../Graph";
import {Container, Navigator} from "../Viewer";
import {IVNodeHash} from "../Render";

interface ISequenceDir {
    name: string;
    preferred: EdgeDirection;
}

export class SimpleNavUI extends UI {
    public static uiName: string = "simplenav";
    private _disposable: rx.IDisposable;

    private _dirNames: {[dir: number]: string};
    private _seqDirs: {[dir: number]: ISequenceDir};

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

        this._seqDirs = {};
        this._seqDirs[EdgeDirection.NEXT] = {name: "Forward", preferred: EdgeDirection.STEP_FORWARD};
        this._seqDirs[EdgeDirection.PREV] = {name: "Backward", preferred: EdgeDirection.STEP_BACKWARD};
    }

    protected _activate(): void {
        this._disposable = this._navigator.stateService.currentNode$.map((node: Node): IVNodeHash => {
            let btns: vd.VNode[] = [];

            let navDirections: EdgeDirection[] = [];
            let navKeys: string[] = [];

            for (let edge of node.edges) {
                let direction: EdgeDirection = edge.data.direction;
                let name: string = this._dirNames[direction];
                if (name == null) {
                    continue;
                }

                navDirections.push(direction);
                navKeys.push(edge.to);

                btns.push(this.createVNode(direction, name));
            }

            // fall back to next and previous if they are not present as other directions
            // and step forward and backward are not represented.
            for (let edge of node.edges) {
                let direction: EdgeDirection = edge.data.direction;
                let seqDir: ISequenceDir = this._seqDirs[direction];
                if (seqDir == null ||
                    navKeys.indexOf(edge.to) > -1 ||
                    navDirections.indexOf(seqDir.preferred) > -1) {
                    continue;
                }

                btns.push(this.createVNode(direction, seqDir.name));
            }

            return {name: this._name, vnode: vd.h(`div.SimpleNavUI`, btns)};
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

export default SimpleNavUI;
