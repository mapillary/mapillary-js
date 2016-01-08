/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />

import * as rx from "rx";

import {Node} from "../Graph";
import {
    FrameGenerator,
    IState,
    CompletingState2,
} from "../State";

export interface ICurrentState2 {
    alpha: number;
    currentNode: Node;
    previousNode: Node;
    trajectory: Node[];
}

interface IStateContext2 extends ICurrentState2 {
    update(): void;
    append(nodes: Node[]): void;
    set(nodes: Node[]): void;
}

export class StateContext2 implements IStateContext2 {
    private state: IState;

    constructor() {
        this.state = new CompletingState2([]);
    }

    public get alpha(): number {
        return this.state.alpha;
    }

    public get currentNode(): Node {
        return this.state.currentNode;
    }

    public get previousNode(): Node {
        return this.state.previousNode;
    }

    public get trajectory(): Node[] {
        return this.state.trajectory;
    }

    public update(): void {
        this.state.update();
    }

    public append(nodes: Node[]): void {
        this.state.append(nodes);
    }

    public set(nodes: Node[]): void {
        this.state.set(nodes);
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

    public get currentNode(): rx.Observable<Node> {
        return this.currentStateSubject
            .map<Node>((c: ICurrentState2): Node => { return c.currentNode; })
            .filter((n: Node): boolean => { return n != null; })
            .distinctUntilChanged();
    }

    public dispose(): void {
        this.frameGenerator.cancelAnimationFrame(this.frameId);
    }

    public appendNodes(nodes: Node[]): void {
        this.context.append(nodes);
    }

    public setNodes(nodes: Node[]): void {
        this.context.set(nodes);
    }

    private frame(time: number): void {
        this.frameId = this.frameGenerator.requestAnimationFrame(this.frame.bind(this));

        this.context.update();

        this.currentStateSubject.onNext(this.context);
    }
}
