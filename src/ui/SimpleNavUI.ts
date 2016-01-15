/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />

import * as rx from "rx";

import {EdgeDirection} from "../Edge";
import {IUI} from "../UI";
import {Node} from "../Graph";
import {Container, Navigator} from "../Viewer";

interface INavigationElement {
    element: HTMLSpanElement;
    preferred?: EdgeDirection;
    subscription: rx.IDisposable;
}

export class SimpleNavUI implements IUI {
    private disposable: rx.IDisposable;
    private element: HTMLElement;
    private navigator: Navigator;

    private elements: { [direction: number]: INavigationElement } = {};
    private sequenceElements: { [direction: number]: INavigationElement } = {};

    constructor(container: Container, navigator: Navigator) {
        let uiContainer: HTMLElement = document.createElement("div");
        uiContainer.className = "SimpleNavUI";
        container.element.appendChild(uiContainer);

        this.element = uiContainer;
        this.navigator = navigator;
    }

    public activate(): void {
        this.createElement(EdgeDirection.STEP_FORWARD, "Forward", this.elements);
        this.createElement(EdgeDirection.STEP_BACKWARD, "Backward", this.elements);
        this.createElement(EdgeDirection.STEP_LEFT, "Left", this.elements);
        this.createElement(EdgeDirection.STEP_RIGHT, "Right", this.elements);
        this.createElement(EdgeDirection.TURN_LEFT, "Turnleft", this.elements);
        this.createElement(EdgeDirection.TURN_RIGHT, "Turnright", this.elements);
        this.createElement(EdgeDirection.TURN_U, "Turnaround", this.elements);

        this.createElement(EdgeDirection.NEXT, "Forward", this.sequenceElements, EdgeDirection.STEP_FORWARD);
        this.createElement(EdgeDirection.PREV, "Backward", this.sequenceElements, EdgeDirection.STEP_BACKWARD);

        this.appendElements(this.elements);
        this.appendElements(this.sequenceElements);

        this.disposable = this.navigator.stateService.currentNode.subscribe((node: Node): void => {
            this.hideElements(this.elements);
            this.hideElements(this.sequenceElements);

            let directions: EdgeDirection[] = [];
            let keys: string[] = [];

            for (let edge of node.edges) {
                let direction: EdgeDirection = edge.data.direction;
                let item: INavigationElement = this.elements[direction];
                if (item == null) {
                    continue;
                }

                directions.push(direction);
                keys.push(edge.to);

                let element: HTMLSpanElement = item.element;
                element.className = element.className.replace(/\DirectionHidden\b/, "");
            }

            for (let edge of node.edges) {
                let item: INavigationElement = this.sequenceElements[edge.data.direction];
                if (item == null || keys.indexOf(edge.to) > -1 || directions.indexOf(item.preferred) > -1) {
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

    private appendElements(elements: { [direction: number]: INavigationElement }): void {
         for (let k in elements) {
             if (elements.hasOwnProperty(k)) {
                 this.element.appendChild(elements[k].element);
             }
        }
    }

    private hideElements(elements: { [direction: number]: INavigationElement }): void {
        for (let k in elements) {
            if (elements.hasOwnProperty(k)) {
                let element: HTMLSpanElement = elements[k].element;
                element.className = element.className.replace(/\DirectionHidden\b/, "");
                element.className += " DirectionHidden";
            }
        }
    }

    private createElement(
        direction: EdgeDirection,
        name: string,
        elements: { [direction: number]: INavigationElement },
        preferred?: EdgeDirection): void {

        let element: HTMLSpanElement = document.createElement("span");
        element.className = `btn Direction Direction${name} DirectionHidden`;

        let subscription: rx.IDisposable = rx.Observable
            .fromEvent<void>(element, "click")
            .subscribe(() => { this.navigator.moveDir(direction).first().subscribe(); });

        elements[direction] = { element: element, preferred: preferred, subscription: subscription };
    }
}

export default SimpleNavUI;
