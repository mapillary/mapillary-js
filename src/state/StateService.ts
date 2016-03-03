/// <reference path="../../typings/browser.d.ts" />

import * as rx from "rx";

import {Node} from "../Graph";
import {
    FrameGenerator,
    IStateContext,
    IFrame,
    IRotation,
    StateContext,
    State,
} from "../State";

interface IStateContextOperation {
    (context: IStateContext): IStateContext;
}

export class StateService {
    private _frame$: rx.Subject<number>;

    private _stateContextOperation$: rx.BehaviorSubject<IStateContextOperation>;
    private _stateContext$: rx.Observable<IStateContext>;

    private _currentState$: rx.Observable<IFrame>;
    private _currentNode$: rx.Observable<Node>;

    private _appendNode$: rx.Subject<Node> = new rx.Subject<Node>();

    private _context: IStateContext;

    private _frameGenerator: FrameGenerator;
    private _frameId: number;

    constructor () {
        this._context = new StateContext();

        this._frame$ = new rx.Subject<number>();
        this._stateContextOperation$ = new rx.BehaviorSubject<IStateContextOperation>(
            (context: IStateContext): IStateContext => {
                return context;
            });

        this._stateContext$ = this._stateContextOperation$
            .scan<IStateContext>(
                (context: IStateContext, operation: IStateContextOperation): IStateContext => {
                    return operation(context);
                },
                this._context);

        this._currentState$ = this._frame$
            .withLatestFrom<IStateContext, [number, IStateContext]>(
                this._stateContext$,
                (frameId: number, context: IStateContext): [number, IStateContext] => {
                    return [frameId, context];
                })
            .do(
                (fc: [number, IStateContext]): void => {
                    fc[1].update();
                })
            .map<IFrame>(
                (fc: [number, IStateContext]): IFrame => {
                    return { id: fc[0], state: fc[1] };
                })
            .shareReplay(1);

        this._currentNode$ = this._currentState$
            .map<Node>(
                (f: IFrame): Node => {
                    return f.state.currentNode;
                })
            .filter(
                (n: Node): boolean => {
                    return n != null;
                })
            .distinctUntilChanged()
            .shareReplay(1);

        this._frameId = null;
        this._frameGenerator = new FrameGenerator();

        this._appendNode$.subscribe((node: Node) => {
            this.appendNodes([node]);
        });
    }

    public get currentState$(): rx.Observable<IFrame> {
        return this._currentState$;
    }

    public get currentNode$(): rx.Observable<Node> {
        return this._currentNode$;
    }

    public get state(): State {
        return this._context.state;
    }

    public dispose(): void {
        this.stop();
    }

    public start(): void {
        if (this._frameId == null) {
            this._frameId = this._frameGenerator.requestAnimationFrame(this.frame.bind(this));
        }
    }

    public stop(): void {
        if (this._frameId != null) {
            this._frameGenerator.cancelAnimationFrame(this._frameId);
            this._frameId = null;
        }
    }

    public traverse(): void {
        this._context.traverse();
    }

    public wait(): void {
        this._context.wait();
    }

    public appendNodes(nodes: Node[]): void {
        this._context.append(nodes);
    }

    public prependNodes(nodes: Node[]): void {
        this._context.prepend(nodes);
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

    public rotate(delta: IRotation): void {
        this._context.rotate(delta);
    }

    public move(delta: number): void {
        this._context.move(delta);
    }

    public moveTo(position: number): void {
        this._context.moveTo(position);
    }

    public get appendNode$(): rx.Subject<Node> {
        return this._appendNode$;
    }

    private frame(time: number): void {
        this._frameId = this._frameGenerator.requestAnimationFrame(this.frame.bind(this));
        this._frame$.onNext(this._frameId);
    }
}
