/// <reference path="../../typings/virtual-dom/virtual-dom.d.ts" />
/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />

import * as rx from "rx";
import * as vd from "virtual-dom";

import {EdgeDirection} from "../Edge";
import {IUI} from "../UI";
import {Node} from "../Graph";
import {Container, Navigator} from "../Viewer";
import {IVNodeHash} from "../Render";

export class SimpleNavUI implements IUI {
    private container: Container;
    private navigator: Navigator;

    private subscription: rx.IDisposable;
    private dirNames: {[dir: number]: string};

    constructor(container: Container, navigator: Navigator) {
        this.container = container;
        this.navigator = navigator;

        // fixme add this to Edge Interface
        this.dirNames = {};
        this.dirNames[EdgeDirection.NEXT] = "Forward";
        this.dirNames[EdgeDirection.PREV] = "Backward";
        this.dirNames[EdgeDirection.STEP_FORWARD] = "Forward";
        this.dirNames[EdgeDirection.STEP_BACKWARD] = "Backward";
        this.dirNames[EdgeDirection.STEP_LEFT] = "Left";
        this.dirNames[EdgeDirection.STEP_RIGHT] = "Right";
        this.dirNames[EdgeDirection.TURN_LEFT] = "Turnleft";
        this.dirNames[EdgeDirection.TURN_RIGHT] = "Turnright";
        this.dirNames[EdgeDirection.TURN_U] = "Turnaround";
    }

    public activate(): void {
        this.subscription = this.navigator.stateService.currentNode$.map((node: Node): IVNodeHash => {
            let btns: vd.VNode[] = [];

            for (let edge of node.edges) {
                let direction: EdgeDirection = edge.data.direction;
                if (!(direction in this.dirNames)) {
                    continue;
                }

                btns.push(this.createVNode(edge.data.direction));
            }

            return {name: "simplenavui", vnode: vd.h(`div.SimpleNavUI`, btns)};
        }).subscribe(this.container.domRenderer.render$);
    }

    public deactivate(): void {
        this.subscription.dispose();
    }

    private createVNode(direction: EdgeDirection): vd.VNode {
        return vd.h(`span.btn.Direction.Direction${this.dirNames[direction]}`,
                    {onclick: (ev: Event): void => { this.navigator.moveDir(direction).first().subscribe(); }},
                    []);
    }
}

export default SimpleNavUI;
