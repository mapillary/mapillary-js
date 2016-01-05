/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="../../typings/lib/lib.d.ts" />

import * as rx from "rx";

import {Node} from "../Graph";

class FrameHelper {
    private _requestAnimationFrame: (callback: FrameRequestCallback) => number;
    private _cancelAnimationFrame: (id: number) => void;

    constructor() {
        if (window.requestAnimationFrame) {
            this._requestAnimationFrame = window.requestAnimationFrame;
            this._cancelAnimationFrame = window.cancelAnimationFrame;
        } else if (window.mozRequestAnimationFrame) {
            this._requestAnimationFrame = window.mozRequestAnimationFrame;
            this._cancelAnimationFrame = window.mozCancelAnimationFrame;
        } else if (window.webkitRequestAnimationFrame) {
            this._requestAnimationFrame = window.webkitRequestAnimationFrame;
            this._cancelAnimationFrame = window.webkitCancelAnimationFrame;
        } else if (window.msRequestAnimationFrame) {
            this._requestAnimationFrame = window.msRequestAnimationFrame;
            this._cancelAnimationFrame = window.msCancelRequestAnimationFrame;
        } else if (window.oRequestAnimationFrame) {
            this._requestAnimationFrame = window.oRequestAnimationFrame;
            this._cancelAnimationFrame = window.oCancelAnimationFrame;
        } else {
            this._requestAnimationFrame = (callback: FrameRequestCallback): number => {
                return window.setTimeout(callback, 1000 / 60);
            };
            this._cancelAnimationFrame = window.clearTimeout;
        }
    }

    public requestAnimationFrame(callback: FrameRequestCallback): number {
        return this._requestAnimationFrame.call(window, callback);
    }

    public cancelAnimationFrame(id: number): void {
        this._cancelAnimationFrame.call(window, id);
    }
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
    private currentStateSubject: rx.Subject<ICurrentState2>;

    private context: IStateContext2;

    private frameHelper: FrameHelper;
    private frameId: number;

    constructor () {
        this.context = new StateContext2();
        this.currentStateSubject = new rx.BehaviorSubject<ICurrentState2>(this.context);

        let frame: FrameRequestCallback = this.frame.bind(this);

        this.frameHelper = new FrameHelper();
        this.frameHelper.requestAnimationFrame(frame);
    }

    public get currentState(): rx.Observable<ICurrentState2> {
        return this.currentStateSubject;
    }

    public dispose(): void {
        this.frameHelper.cancelAnimationFrame(this.frameId);
    }

    public appendNodes(nodes: Node[]): void {
        this.context.appendNodes(nodes);
    }

    private frame(time: number): void {
        this.frameId = window.requestAnimationFrame(this.frame.bind(this));

        this.context.update();

        this.currentStateSubject.onNext(this.context);
    }
}
