/// <reference path="../../typings/rx-dom/rx.dom.d.ts" />
/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />

import * as rx from "rx";
import * as rxdom from "rx.dom";

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
}

export class StateContext2 implements IStateContext2 {
    public previous: Node;
    public current: Node;
    public trajectory: Node[];
    public alpha: number = 0;

    public update(): void {
        this.alpha = 0;
    }

    public appendNodes(nodes: Node[]): void {
        for (let i: number; i < nodes.length; i++) {
            this.trajectory.push(nodes[i]);
        }
    }
}

export class StateService2 {
    public currentState: rx.Observable<IStateContext2>;

    private frame: rx.Subject<any> = new rx.Subject<any>();
    private updateCurrentState: rx.Subject<IStateContextOperation2> = new rx.Subject<IStateContextOperation2>();

    private context: IStateContext2;
    private frameSubscription: rx.IDisposable;

    constructor () {
        this.context = new StateContext2();

        this.currentState = this.updateCurrentState
            .scan<IStateContext2>(
                (context: IStateContext2, operation: IStateContextOperation2): IStateContext2 => {
                    context.update();

                    let currentState: IStateContext2 = operation(context);

                    return currentState;
                },
                this.context)
                .shareReplay(1);

        this.frame.map<IStateContextOperation2>((i: number): IStateContextOperation2 => {
            return ((context: IStateContext2) => {
                return context;
            });
        }).subscribe(this.updateCurrentState);

        let frameScheduler: rxdom.IRequestAnimationFrameScheduler = rx.Scheduler.requestAnimationFrame;

        this.frameSubscription = rx.Observable.generate<number, number>(
            0,
            function (x: number): boolean { return true; },
            function (x: number): number { return x + 1; },
            function (x: number): number { return x; },
            frameScheduler
        ).subscribe(this.frame);
    }

    public dispose(): void {
        this.frameSubscription.dispose();
    }
}
