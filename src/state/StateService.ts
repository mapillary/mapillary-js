/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />

import * as rx from "rx";

import {Node} from "../Graph";

interface ICurrentStateOperation extends Function {
  (currentState: ICurrentState): ICurrentState;
}

export interface ICurrentState {
    previousNode: Node;
    currentNode: Node;
    currentAlpha: number;
    nextNodes: Node[];
}

export class StateService {
    public tick: rx.Subject<any> = new rx.Subject<any>();

    public appendCurrentState: rx.Subject<Node[]> = new rx.Subject<Node[]>();
    public resetCurrentState: rx.Subject<Node[]> = new rx.Subject<Node[]>();

    public updateCurrentState: rx.Subject<ICurrentStateOperation> = new rx.Subject<ICurrentStateOperation>();
    public currentState: rx.Observable<ICurrentState>;
    public currentNode: rx.Observable<Node>;

    private animationSpeed: number = 0.20;

    constructor () {
        this.currentState = this.updateCurrentState
            .scan<ICurrentState>(
            (cs: ICurrentState, operation: ICurrentStateOperation): ICurrentState => {
                let currentState: ICurrentState = operation(cs);

                if (currentState.nextNodes.length === 1) {
                    currentState.currentNode = currentState.previousNode = currentState.nextNodes[0];
                    currentState.currentAlpha = 0;
                    return currentState;
                } else if (currentState.currentAlpha < 1) {
                    currentState.previousNode = currentState.nextNodes[0];
                    currentState.currentNode = currentState.nextNodes[1];
                    currentState.currentAlpha += this.animationSpeed;
                    return currentState;
                }

                currentState.nextNodes.shift();

                if (currentState.nextNodes.length === 1) {
                    currentState.currentNode = currentState.previousNode = currentState.nextNodes[0];
                    currentState.currentAlpha = 0;
                    return currentState;
                }

                currentState.currentAlpha = 0;
                currentState.previousNode = currentState.currentNode;
                currentState.currentNode = currentState.nextNodes[1];
                return currentState;
            },
            {currentAlpha: 0, currentNode: null, nextNodes: [], previousNode: null})
            .shareReplay(1);

        this.resetCurrentState.map<ICurrentStateOperation>((nodes: Node[]): ICurrentStateOperation => {
            return ((currentState: ICurrentState) => {
                currentState.currentAlpha = 0;
                currentState.nextNodes = nodes;
                return currentState;
            });
        }).subscribe(this.updateCurrentState);

        this.appendCurrentState.map<ICurrentStateOperation>((nodes: Node[]): ICurrentStateOperation => {
            return ((currentState: ICurrentState) => {
                currentState.nextNodes = currentState.nextNodes.concat(nodes);
                return currentState;
            });
        }).subscribe(this.updateCurrentState);

        this.currentNode = this.currentState.map((currentState: ICurrentState): Node => {
            if (currentState != null && currentState.currentNode != null) {
                return currentState.currentNode;
            }
            return null;
        }).filter((node: Node): boolean => {
            return node != null;
        }).distinctUntilChanged();

        this.tick.map<ICurrentStateOperation>((i: number): ICurrentStateOperation => {
            return ((currentState: ICurrentState) => {
                return currentState;
            });
        }).subscribe(this.updateCurrentState);

        rx.Observable.generateWithAbsoluteTime(
            1,
            (x: number) => { return true; },
            (x: number) => { return x + 1; },
            (x: number) => { return x; },
            (x: number): Date => { return new Date(new Date().getTime() + (100)); }
        ).timeInterval().subscribe(this.tick);
    }

    public startMove(nodes: Node[]): void {
        this.resetCurrentState.onNext(nodes);
    }

    public appendMove(nodes: Node[]): void {
        this.appendCurrentState.onNext(nodes);
    }

    public tickState(): void {
        this.tick.onNext({});
    }
}

export default StateService;
