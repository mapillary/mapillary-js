/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />

import * as rx from "rx";

import {Node} from "../Graph";
import {FrameGenerator} from "../State";

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
        for (let node of nodes) {
            this.trajectory.push(node);
        }
    }
}

export class StateService2 {
    private currentStateSubject: rx.Subject<ICurrentState2>;

    private context: IStateContext2;

    private frameGenerator: FrameGenerator;
    private frameId: number;

    constructor () {
        this.context = new StateContext2();
        this.currentStateSubject = new rx.BehaviorSubject<ICurrentState2>(this.context);

        this.frameGenerator = new FrameGenerator();
        this.frameGenerator.requestAnimationFrame(this.frame.bind(this));
    }

    public get currentState(): rx.Observable<ICurrentState2> {
        return this.currentStateSubject;
    }

    public dispose(): void {
        this.frameGenerator.cancelAnimationFrame(this.frameId);
    }

    public appendNodes(nodes: Node[]): void {
        this.context.appendNodes(nodes);
    }

    private frame(time: number): void {
        this.frameId = this.frameGenerator.requestAnimationFrame(this.frame.bind(this));

        this.context.update();

        this.currentStateSubject.onNext(this.context);
    }
}
