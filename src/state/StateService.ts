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
    private _currentState$: rx.Subject<ICurrentState>;
    private _currentNode$: rx.Observable<Node>;

    private _context: IStateContext;

    private _frameGenerator: FrameGenerator;
    private _frameId: number;

    constructor () {
        this._context = new StateContext();
        this._currentState$ = new rx.BehaviorSubject<ICurrentState>(this._context);

        this._currentNode$ = this._currentState$
            .map<Node>((c: ICurrentState): Node => { return c.currentNode; })
            .filter((n: Node): boolean => { return n != null; })
            .distinctUntilChanged();

        this._frameGenerator = new FrameGenerator();
        this._frameGenerator.requestAnimationFrame(this.frame.bind(this));
    }

    public get currentState$(): rx.Observable<ICurrentState> {
        return this._currentState$;
    }

    public get currentNode$(): rx.Observable<Node> {
        return this._currentNode$;
    }

    public dispose(): void {
        this._frameGenerator.cancelAnimationFrame(this._frameId);
    }

    public appendNodes(nodes: Node[]): void {
        this._context.append(nodes);
    }

    public removeNodes(n: number): void {
        this._context.remove(n);
    }

    public cutNodes(): void {
        this._context.cut();
    }

    public setNodes(nodes: Node[]): void {
        this._context.set(nodes);
    }

    private frame(time: number): void {
        this._frameId = this._frameGenerator.requestAnimationFrame(this.frame.bind(this));

        this._context.update();

        this._currentState$.onNext(this._context);
    }
}
