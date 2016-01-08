/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />

import * as rx from "rx";

import {Node} from "../Graph";
import {FrameGenerator} from "../State";

export interface IState {
    alpha: number;
    currentNode: Node;
    previousNode: Node;
    trajectory: Node[];

    update(): void;
    append(nodes: Node[]): void;
    set(nodes: Node[]): void;
}

export class CompletingState2 implements IState {
    private _alpha: number;
    private _animationSpeed: number;

    private _trajectory: Node[];

    private _currentIndex: number;
    private _currentNode: Node;
    private _previousNode: Node;

    constructor (trajectory: Node[]) {
        this._alpha = trajectory.length > 0 ? 0 : 1;
        this._animationSpeed = 0.025;

        this._trajectory = trajectory.slice();

        this._currentIndex = 0;
        this._currentNode = trajectory.length > 0 ? trajectory[this._currentIndex] : null;
        this._previousNode = null;
    }

    public append(trajectory: Node[]): void {
        this._trajectory = this._trajectory.concat(trajectory);
    }

    public set(trajectory: Node[]): void {
        if (trajectory.length < 1) {
            throw Error("Trajectory can not be empty");
        }

        if (this._currentNode != null) {
            this._trajectory = [this._currentNode].concat(trajectory);
            this._currentIndex = 1;
        } else {
            this._trajectory = trajectory.slice();
            this._currentIndex = 0;
        }

        this._alpha = 0;

        this._currentNode = this.trajectory[this._currentIndex];
        this._previousNode = this._trajectory[this._currentIndex - 1];
    }

    public update(): void {
        if (this._alpha === 1 && this._currentIndex + this._alpha < this._trajectory.length) {
            this._alpha = 0;

            this._currentIndex += 1;
            this._currentNode = this._trajectory[this._currentIndex];
            this._previousNode = this._trajectory[this._currentIndex - 1];
        }

        this._alpha = Math.min(1, this._alpha + this._animationSpeed);
    }

    public get alpha(): number {
        return this._alpha;
    }

    public get currentNode(): Node {
        return this._currentNode;
    }

    public get previousNode(): Node {
        return this._previousNode;
    }

    public get trajectory(): Node[] {
        return this._trajectory;
    }
}

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
