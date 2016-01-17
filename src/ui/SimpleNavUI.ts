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

    constructor(name: string) {
        this.element = document.createElement("span");
        this.element.className = `btn Direction Direction${name} DirectionHidden`;
    }

    public get visible(): boolean {
        return !this.hasHiddenClass();
    }

    public set visible(value: boolean) {
        if (value !== this.hasHiddenClass()) {
            return;
        }

        this.element.className = value ?
            this.element.className.replace(/\ DirectionHidden\b/, "") :
            this.element.className + " DirectionHidden";
    }

    private hasHiddenClass(): boolean {
        return this.element.className.indexOf("DirectionHidden") > -1;
    }
}

export class SimpleNavUI implements IUI {
    private container: Container;
    private navigator: Navigator;

    private subscription: rx.IDisposable;
    private element: HTMLDivElement;

    private elements: { [direction: number]: INavigation } = {};
    private sequenceElements: { [direction: number]: INavigation } = {};

    constructor(container: Container, navigator: Navigator) {
        this.container = container;
        this.navigator = navigator;
    }

    public activate(): void {
        this.createContainerElement();

        this.createNavigationElement(EdgeDirection.STEP_FORWARD, "Forward", this.elements);
        this.createNavigationElement(EdgeDirection.STEP_BACKWARD, "Backward", this.elements);
        this.createNavigationElement(EdgeDirection.STEP_LEFT, "Left", this.elements);
        this.createNavigationElement(EdgeDirection.STEP_RIGHT, "Right", this.elements);
        this.createNavigationElement(EdgeDirection.TURN_LEFT, "Turnleft", this.elements);
        this.createNavigationElement(EdgeDirection.TURN_RIGHT, "Turnright", this.elements);
        this.createNavigationElement(EdgeDirection.TURN_U, "Turnaround", this.elements);

        this.createNavigationElement(EdgeDirection.NEXT, "Forward", this.sequenceElements, EdgeDirection.STEP_FORWARD);
        this.createNavigationElement(EdgeDirection.PREV, "Backward", this.sequenceElements, EdgeDirection.STEP_BACKWARD);

        this.subscription = this.navigator.stateService.currentNode$.subscribe((node: Node): void => {
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

                item.navigation.visible = true;
            }

            for (let edge of node.edges) {
                let item: INavigation = this.sequenceElements[edge.data.direction];
                if (item == null || keys.indexOf(edge.to) > -1 || directions.indexOf(item.preferred) > -1) {
                    continue;
                }

                item.navigation.visible = true;
            }
        });
    }

    public deactivate(): void {
        this.subscription.dispose();
        this.subscription = null;

        this.deleteNavigationElements(this.elements);
        this.deleteNavigationElements(this.sequenceElements);

        this.container.element.removeChild(this.element);
        this.element = null;
    }

    private hideElements(elements: { [direction: number]: INavigation }): void {
        for (let k in elements) {
            if (!elements.hasOwnProperty(k)) {
                continue;
            }

            elements[k].navigation.visible = false;
        }
    }

    private createContainerElement(): void {
        let element: HTMLDivElement = document.createElement("div");
        element.className = "SimpleNavUI";

        this.container.element.appendChild(element);
        this.element = element;
    }

    private createNavigationElement(
        direction: EdgeDirection,
        name: string,
        elements: { [direction: number]: INavigation },
        preferred?: EdgeDirection): void {

        let navigation: NavigationElement = new NavigationElement(name);

        this.element.appendChild(navigation.element);

        let subscription: rx.IDisposable = rx.Observable
            .fromEvent<void>(navigation.element, "click")
            .subscribe(() => { this.navigator.moveDir(direction).first().subscribe(); });

        elements[direction] = { navigation: navigation, preferred: preferred, subscription: subscription };
    }

    private deleteNavigationElements(elements: { [direction: number]: INavigation }): void {
        for (let k in elements) {
            if (!elements.hasOwnProperty(k)) {
                continue;
            }

            elements[k].subscription.dispose();

            this.element.removeChild(elements[k].navigation.element);
            delete elements[k];
        }
    }
}

export default SimpleNavUI;
