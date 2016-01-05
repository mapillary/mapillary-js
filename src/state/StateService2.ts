/// <reference path="../../typings/rx-dom/rx.dom.d.ts" />
/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />

import * as rx from "rx";

import {Node} from "../Graph";

interface IStateContextOperation2 extends Function {
    (context: IStateContext2): IStateContext2;
}

export interface ICurrentState2 {
    previous: Node;
    current: Node;
    alpha: number;
    trajectory: Node[];
}

interface IStateContext2 extends ICurrentState2 {
    update(): void;

    appendNodes(nodes: Node[]): void;
}

export class StateContext2 implements IStateContext2 {
    public previous: Node;
    public current: Node;
    public trajectory: Node[];

    public alpha: number;

    constructor() {
        this.previous = null;
        this.current = null;
        this.trajectory = [];

        this.alpha = 0;
    }

    public update(): void {
        this.alpha += 1;
    }

    public appendNodes(nodes: Node[]): void {
        for (let i: number = 0; i < nodes.length; i++) {
            this.trajectory.push(nodes[i]);
        }
    }
}

export class StateService2 {
    public currentState: rx.Observable<ICurrentState2>;

    private context: IStateContext2;
    private frameSubscription: rx.IDisposable;

    constructor () {
        this.context = new StateContext2();

        this.currentState = rx.Observable.generate<IStateContext2, ICurrentState2>(
            this.context,
            function (context: IStateContext2): boolean { return true; },
            function (context: IStateContext2): IStateContext2 {
                    context.update();

                    return context;
                },
            function (context: IStateContext2): ICurrentState2 { return context; },
            rx.Scheduler.requestAnimationFrame
        ).shareReplay(1);
    }

    public dispose(): void {
        this.frameSubscription.dispose();
    }

    public appendNodes(nodes: Node[]): void {
        this.context.appendNodes(nodes);
    }
}
