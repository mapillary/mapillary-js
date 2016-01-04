/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />

import * as rx from "rx";

import {IEdge, EdgeConstants} from "../Edge";
import {Node} from "../Graph";
import {IActivatableUI} from "../UI";
import {ICurrentState} from "../State";
import {Navigator} from "../Viewer";

interface INavigationElement {
    element: HTMLSpanElement;
    subscription: rx.IDisposable;
}

export class CssUI implements IActivatableUI {
    public graphSupport: boolean = true;

    private container: HTMLElement;
    private disposable: rx.IDisposable;
    private navigator: Navigator;

    private elements: { [direction: number]: INavigationElement } = {};
    private directions: { [direction: number]: string } = {};

    constructor(container: HTMLElement, navigator: Navigator) {
        this.directions[EdgeConstants.Direction.STEP_FORWARD] = "Forward";
        this.directions[EdgeConstants.Direction.STEP_BACKWARD] = "Backward";
        this.directions[EdgeConstants.Direction.STEP_LEFT] = "Left";
        this.directions[EdgeConstants.Direction.STEP_RIGHT] = "Right";
        this.directions[EdgeConstants.Direction.TURN_LEFT] = "Turnleft";
        this.directions[EdgeConstants.Direction.TURN_RIGHT] = "Turnright";
        this.directions[EdgeConstants.Direction.TURN_U] = "Turnaround";

        let uiContainer: HTMLElement = document.createElement("div");
        uiContainer.className = "CssUi";
        container.appendChild(uiContainer);

        this.container = uiContainer;
        this.navigator = navigator;
    }

    public activate(): void {
        this.elements[EdgeConstants.Direction.STEP_FORWARD] =
            this.createElement(EdgeConstants.Direction.STEP_FORWARD);
        this.elements[EdgeConstants.Direction.STEP_BACKWARD] =
            this.createElement(EdgeConstants.Direction.STEP_BACKWARD);
        this.elements[EdgeConstants.Direction.STEP_LEFT] =
            this.createElement(EdgeConstants.Direction.STEP_LEFT);
        this.elements[EdgeConstants.Direction.STEP_RIGHT] =
            this.createElement(EdgeConstants.Direction.STEP_RIGHT);
        this.elements[EdgeConstants.Direction.TURN_LEFT] =
            this.createElement(EdgeConstants.Direction.TURN_LEFT);
        this.elements[EdgeConstants.Direction.TURN_RIGHT] =
            this.createElement(EdgeConstants.Direction.TURN_RIGHT);
        this.elements[EdgeConstants.Direction.TURN_U] =
            this.createElement(EdgeConstants.Direction.TURN_U);

        for (let k in this.elements) {
             if (this.elements.hasOwnProperty(k)) {
                let element: HTMLSpanElement = this.elements[k].element;
                this.container.appendChild(element);
             }
        }

        this.disposable = this.navigator.stateService.currentState
            .distinctUntilChanged((cs: ICurrentState) => {
                if (cs.currentNode) {
                    return cs.currentNode.key;
                }
            })
            .subscribe((currentState: ICurrentState) => {
                if (currentState != null && currentState.currentNode != null) {
                    for (let k in this.elements) {
                        if (this.elements.hasOwnProperty(k)) {
                            let element: HTMLSpanElement = this.elements[k].element;
                            element.className =
                                element.className.replace(/\DirectionHidden\b/, "");
                            element.className += " DirectionHidden";
                        }
                    }

                    let edges: IEdge[] = currentState.currentNode.edges;
                    for (let i: number = 0; i < edges.length; i++) {
                        let item: INavigationElement = this.elements[edges[i].data.direction];
                        if (item == null) {
                            continue;
                        }

                        let element: HTMLSpanElement = item.element;
                        element.className =
                            element.className.replace(/\DirectionHidden\b/, "");
                    }
                }
            });
        return;
    }

    public deactivate(): void {
        this.disposable.dispose();

        for (let k in this.elements) {
             if (this.elements.hasOwnProperty(k)) {
                this.elements[k].subscription.dispose();
             }
        }
    }

    public display(node: Node): void {
        return;
    }

    private move(direction: EdgeConstants.Direction): void {
        this.navigator.moveDir(direction).first().subscribe();
    }

    private createElement(direction: EdgeConstants.Direction): INavigationElement {
        let element: HTMLSpanElement = document.createElement("span");

        let name: string = this.directions[direction];
        element.className = `btn Direction Direction${name} DirectionHidden`;

        let move: (direction: EdgeConstants.Direction) => void = this.move.bind(this);

        let clickStream: rx.Observable<void> = rx.Observable.fromEvent<void>(element, "click");
        let subscription: rx.IDisposable = clickStream.subscribe(() => { move(direction); });

        return { element: element, subscription: subscription };
    }
}

export default CssUI;
