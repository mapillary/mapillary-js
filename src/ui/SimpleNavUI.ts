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

    constructor(container: Container, navigator: Navigator) {
        let uiContainer: HTMLElement = document.createElement("div");
        uiContainer.className = "SimpleNavUI";
        container.element.appendChild(uiContainer);

        this.element = uiContainer;
        this.navigator = navigator;
    }

    public activate(): void {
        this.createElement(EdgeDirection.STEP_FORWARD, "Forward");
        this.createElement(EdgeDirection.STEP_BACKWARD, "Backward");
        this.createElement(EdgeDirection.STEP_LEFT, "Left");
        this.createElement(EdgeDirection.STEP_RIGHT, "Right");
        this.createElement(EdgeDirection.TURN_LEFT, "Turnleft");
        this.createElement(EdgeDirection.TURN_RIGHT, "Turnright");
        this.createElement(EdgeDirection.TURN_U, "Turnaround");

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

    private createElement(direction: EdgeDirection, name: string): void {
        let element: HTMLSpanElement = document.createElement("span");
        element.className = `btn Direction Direction${name} DirectionHidden`;

        let move: (direction: EdgeDirection) => void = this.move.bind(this);

        let clickStream: rx.Observable<void> = rx.Observable.fromEvent<void>(element, "click");
        let subscription: rx.IDisposable = clickStream.subscribe(() => { move(direction); });

        this.elements[direction] = { element: element, subscription: subscription };
    }
}

export default SimpleNavUI;
