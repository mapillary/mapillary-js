/// <reference path="../../typings/virtual-dom/virtual-dom.d.ts" />
/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />

import * as rx from "rx";
import * as vd from "virtual-dom";

import {EdgeDirection} from "../Edge";
import {IUI} from "../UI";
import {Node} from "../Graph";
import {Container, Navigator} from "../Viewer";
import {IVNodeHash} from "../Render";

interface ISequenceDir {
    name: string;
    preferred: EdgeDirection;
}

export class SimpleNavUI implements IUI {
    private container: Container;
    private navigator: Navigator;

    private subscription: rx.IDisposable;
    private dirNames: {[dir: number]: string};
    private seqDirs: {[dir: number]: ISequenceDir};

    private name: string;

    constructor(container: Container, navigator: Navigator) {
        this.container = container;
        this.navigator = navigator;

        // fixme add this to Edge Interface
        this.dirNames = {};
        this.dirNames[EdgeDirection.STEP_FORWARD] = "Forward";
        this.dirNames[EdgeDirection.STEP_BACKWARD] = "Backward";
        this.dirNames[EdgeDirection.STEP_LEFT] = "Left";
        this.dirNames[EdgeDirection.STEP_RIGHT] = "Right";
        this.dirNames[EdgeDirection.TURN_LEFT] = "Turnleft";
        this.dirNames[EdgeDirection.TURN_RIGHT] = "Turnright";
        this.dirNames[EdgeDirection.TURN_U] = "Turnaround";

        this.seqDirs = {};
        this.seqDirs[EdgeDirection.NEXT] = {name: "Forward", preferred: EdgeDirection.STEP_FORWARD};
        this.seqDirs[EdgeDirection.PREV] = {name: "Backward", preferred: EdgeDirection.STEP_BACKWARD};

        this.name = "simplenavui";
    }

    public activate(): void {
        this.subscription = this.navigator.stateService.currentNode$.map((node: Node): IVNodeHash => {
            let btns: vd.VNode[] = [];

            let navDirections: EdgeDirection[] = [];
            let navKeys: string[] = [];

            for (let edge of node.edges) {
                let direction: EdgeDirection = edge.data.direction;
                let name: string = this.dirNames[direction];
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
                let seqDir: ISequenceDir = this.seqDirs[direction];
                if (seqDir == null ||
                    navKeys.indexOf(edge.to) > -1 ||
                    navDirections.indexOf(seqDir.preferred) > -1) {
                    continue;
                }

                btns.push(this.createVNode(direction, seqDir.name));
            }

            return {name: this.name, vnode: vd.h(`div.SimpleNavUI`, btns)};
        }).subscribe(this.container.domRenderer.render$);
    }

    public deactivate(): void {
        this.subscription.dispose();
        this.container.domRenderer.clear(this.name);
    }

    private createVNode(direction: EdgeDirection, name: string): vd.VNode {
        return vd.h(`span.btn.Direction.Direction${name}`,
                    {onclick: (ev: Event): void => { this.navigator.moveDir(direction).first().subscribe(); }},
                    []);
    }
}

export default SimpleNavUI;
