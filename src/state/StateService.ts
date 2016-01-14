/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />

import * as rx from "rx";

import {Node} from "../Graph";
import {
    FrameGenerator,
    ICurrentState,
    IStateContext,
    StateContext,
} from "../State";

export class StateService {
    private currentStateSubject: rx.Subject<ICurrentState>;

    private context: IStateContext;

    private frameGenerator: FrameGenerator;
    private frameId: number;

    constructor () {
        this.context = new StateContext();
        this.currentStateSubject = new rx.BehaviorSubject<ICurrentState>(this.context);

        this.frameGenerator = new FrameGenerator();
        this.frameGenerator.requestAnimationFrame(this.frame.bind(this));
    }

    public get currentState(): rx.Observable<ICurrentState> {
        return this.currentStateSubject;
    }

    public get currentNode(): rx.Observable<Node> {
        return this.currentStateSubject
            .map<Node>((c: ICurrentState): Node => { return c.currentNode; })
            .filter((n: Node): boolean => { return n != null; })
            .distinctUntilChanged();
    }

    public dispose(): void {
        this.frameGenerator.cancelAnimationFrame(this.frameId);
    }

    public appendNodes(nodes: Node[]): void {
        this.context.append(nodes);
    }

    public removeNodes(n: number): void {
        this.context.remove(n);
    }

    public cutNodes(): void {
        this.context.cut();
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
