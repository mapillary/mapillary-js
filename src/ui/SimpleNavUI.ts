/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />

import * as rx from "rx";

import {IEdge, EdgeDirection} from "../Edge";
import {IUI} from "../UI";
import {Node} from "../Graph";
import {Container, Navigator} from "../Viewer";

interface INavigationElement {
    element: HTMLSpanElement;
    subscription: rx.IDisposable;
}

export class SimpleNavUI implements IUI {
    private disposable: rx.IDisposable;
    private element: HTMLElement;
    private navigator: Navigator;

    private elements: { [direction: number]: INavigationElement } = {};
    private directions: { [direction: number]: string } = {};

    constructor(container: Container, navigator: Navigator) {
        this.directions[EdgeDirection.STEP_FORWARD] = "Forward";
        this.directions[EdgeDirection.STEP_BACKWARD] = "Backward";
        this.directions[EdgeDirection.STEP_LEFT] = "Left";
        this.directions[EdgeDirection.STEP_RIGHT] = "Right";
        this.directions[EdgeDirection.TURN_LEFT] = "Turnleft";
        this.directions[EdgeDirection.TURN_RIGHT] = "Turnright";
        this.directions[EdgeDirection.TURN_U] = "Turnaround";

        let uiContainer: HTMLElement = document.createElement("div");
        uiContainer.className = "SimpleNavUI";
        container.element.appendChild(uiContainer);

        this.element = uiContainer;
        this.navigator = navigator;
    }

    public activate(): void {
        this.elements[EdgeDirection.STEP_FORWARD] =
            this.createElement(EdgeDirection.STEP_FORWARD);
        this.elements[EdgeDirection.STEP_BACKWARD] =
            this.createElement(EdgeDirection.STEP_BACKWARD);
        this.elements[EdgeDirection.STEP_LEFT] =
            this.createElement(EdgeDirection.STEP_LEFT);
        this.elements[EdgeDirection.STEP_RIGHT] =
            this.createElement(EdgeDirection.STEP_RIGHT);
        this.elements[EdgeDirection.TURN_LEFT] =
            this.createElement(EdgeDirection.TURN_LEFT);
        this.elements[EdgeDirection.TURN_RIGHT] =
            this.createElement(EdgeDirection.TURN_RIGHT);
        this.elements[EdgeDirection.TURN_U] =
            this.createElement(EdgeDirection.TURN_U);

        for (let k in this.elements) {
             if (this.elements.hasOwnProperty(k)) {
                let element: HTMLSpanElement = this.elements[k].element;
                this.element.appendChild(element);
             }
        }

        this.disposable = this.navigator.stateService.currentNode.subscribe((node: Node): void => {
            for (let k in this.elements) {
                if (this.elements.hasOwnProperty(k)) {
                    let element: HTMLSpanElement = this.elements[k].element;
                    element.className = element.className.replace(/\DirectionHidden\b/, "");
                    element.className += " DirectionHidden";
                }
            }

            let edges: IEdge[] = node.edges;
            for (let edge of edges) {
                let item: INavigationElement = this.elements[edge.data.direction];
                if (item == null) {
                    continue;
                }

                let element: HTMLSpanElement = item.element;
                element.className = element.className.replace(/\DirectionHidden\b/, "");
            }
        });
    }

    public deactivate(): void {
        this.disposable.dispose();

        for (let k in this.elements) {
             if (this.elements.hasOwnProperty(k)) {
                this.elements[k].subscription.dispose();
             }
        }
    }

    private move(direction: EdgeDirection): void {
        this.navigator.moveDir(direction).first().subscribe();
    }

    private createElement(direction: EdgeDirection): INavigationElement {
        let element: HTMLSpanElement = document.createElement("span");

        let name: string = this.directions[direction];
        element.className = `btn Direction Direction${name} DirectionHidden`;

        let move: (direction: EdgeDirection) => void = this.move.bind(this);

        let clickStream: rx.Observable<void> = rx.Observable.fromEvent<void>(element, "click");
        let subscription: rx.IDisposable = clickStream.subscribe(() => { move(direction); });

        return { element: element, subscription: subscription };
    }
}

export default SimpleNavUI;
