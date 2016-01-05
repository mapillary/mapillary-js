/// <reference path="../../typings/rx-dom/rx.dom.d.ts" />
/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />

import * as rx from "rx";
import * as rxdom from "rx.dom";

import {Node} from "../Graph";

export class StateContext2 {
    private nodes: Node[] = [];
    private alpha: number = 0;

    public update(): void {
        this.alpha = 0;
    }

    public appendNodes(nodes: Node[]): void {
        for (let i: number; i < nodes.length; i++) {
            this.nodes.push(nodes[i]);
        }
    }
}

export class StateService2 {
    private context: StateContext2;
    private frameSubscription: rx.IDisposable;

    constructor () {
        this.context = new StateContext2();

        let frameScheduler: rxdom.IRequestAnimationFrameScheduler = rx.Scheduler.requestAnimationFrame;
        let frame: () => void = this.frame.bind(this);

        this.frameSubscription = rx.Observable.generate(
            0,
            function (x: number): boolean { return true; },
            function (x: number): number { return x + 1; },
            function (x: number): number { return x; },
            frameScheduler
        ).subscribe(frame);
    }

    public dispose(): void {
        this.frameSubscription.dispose();
    }

    public frame(): void {
        this.context.update();
    }
}
