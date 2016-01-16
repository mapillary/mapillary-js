/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />

import * as rx from "rx";

import {EdgeDirection} from "../Edge";
import {IUI} from "../UI";
import {Node} from "../Graph";
import {Container, Navigator} from "../Viewer";

interface INavigation {
    navigation: NavigationElement;
    preferred?: EdgeDirection;
    subscription: rx.IDisposable;
}

class NavigationElement {
    public element: HTMLSpanElement;

    constructor(element: HTMLSpanElement, name: string) {
        this.element = element;
        this.element.className = `btn Direction Direction${name} DirectionHidden`;
    }

    public get hidden(): boolean {
        return this.hasHiddenClass();
    }

    public set hidden(value: boolean) {
        if (value && !this.hasHiddenClass()) {
            this.element.className += " DirectionHidden";
        } else if (!value) {
            this.element.className = this.element.className.replace(/\DirectionHidden\b/, "");
        }
    }

    private hasHiddenClass(): boolean {
        return this.element.className.indexOf("DirectionHidden") > -1;
    }
}

export class SimpleNavUI implements IUI {
    private disposable: rx.IDisposable;
    private element: HTMLElement;
    private navigator: Navigator;

    private elements: { [direction: number]: INavigation } = {};
    private sequenceElements: { [direction: number]: INavigation } = {};

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

        this.disposable = this.navigator.stateService.currentNode$.subscribe((node: Node): void => {
            this.hideElements(this.elements);
            this.hideElements(this.sequenceElements);

            let directions: EdgeDirection[] = [];
            let keys: string[] = [];

            for (let edge of node.edges) {
                let direction: EdgeDirection = edge.data.direction;
                let item: INavigation = this.elements[direction];
                if (item == null) {
                    continue;
                }

                directions.push(direction);
                keys.push(edge.to);

                item.navigation.hidden = false;
            }

            for (let edge of node.edges) {
                let item: INavigation = this.sequenceElements[edge.data.direction];
                if (item == null || keys.indexOf(edge.to) > -1 || directions.indexOf(item.preferred) > -1) {
                    continue;
                }

                item.navigation.hidden = false;
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

    private appendElements(elements: { [direction: number]: INavigation }): void {
         for (let k in elements) {
             if (elements.hasOwnProperty(k)) {
                 this.element.appendChild(elements[k].navigation.element);
             }
        }
    }

    private hideElements(elements: { [direction: number]: INavigation }): void {
        for (let k in elements) {
            if (elements.hasOwnProperty(k)) {
                elements[k].navigation.hidden = true;
            }
        }
    }

    private createElement(
        direction: EdgeDirection,
        name: string,
        elements: { [direction: number]: INavigation },
        preferred?: EdgeDirection): void {

        let navigation: NavigationElement = new NavigationElement(document.createElement("span"), name);

        let subscription: rx.IDisposable = rx.Observable
            .fromEvent<void>(navigation.element, "click")
            .subscribe(() => { this.navigator.moveDir(direction).first().subscribe(); });

        elements[direction] = { navigation: navigation, preferred: preferred, subscription: subscription };
    }
}

export default SimpleNavUI;
