/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />

import * as rx from "rx";

import {IEdge, EdgeConstants} from "../Edge";
import {Node} from "../Graph";
import {IActivatableUI} from "../UI";
import {ICurrentState, StateService} from "../State";
import {Viewer} from "../Viewer";

export class CssUI implements IActivatableUI {
    public graphSupport: boolean = true;

    private container: HTMLElement;
    private disposable: rx.IDisposable;
    private stateService: StateService;
    private viewer: Viewer;

    private elements: { [direction: string]: HTMLSpanElement } = {};
    private directionClassMappings: { [direction: string]: string } = {};

    // inject viewer here --------------->
    constructor(container: HTMLElement, viewer: Viewer, stateService: StateService) {
        this.directionClassMappings[EdgeConstants.Direction.STEP_FORWARD] = "Forward";
        this.directionClassMappings[EdgeConstants.Direction.STEP_BACKWARD] = "Backward";
        this.directionClassMappings[EdgeConstants.Direction.STEP_LEFT] = "Left";
        this.directionClassMappings[EdgeConstants.Direction.STEP_RIGHT] = "Right";
        this.directionClassMappings[EdgeConstants.Direction.TURN_U] = "Turnaround";

        let uiContainer: HTMLElement = document.createElement("div");
        uiContainer.className = "CssUi";
        container.appendChild(uiContainer);

        this.container = uiContainer;
        this.stateService = stateService;
        this.viewer = viewer;
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
        this.elements[EdgeConstants.Direction.TURN_U] =
            this.createElement(EdgeConstants.Direction.TURN_U);

        for (let k in this.elements) {
             if (this.elements.hasOwnProperty(k)) {
                let element: HTMLSpanElement = this.elements[k];
                this.container.appendChild(element);
             }
        }

        this.disposable = this.stateService.currentState.subscribe((currentState: ICurrentState) => {
            if (currentState != null && currentState.currentNode != null) {
                for (let k in this.elements) {
                    if (this.elements.hasOwnProperty(k)) {
                        let element: HTMLSpanElement = this.elements[k];
                        element.className =
                            element.className.replace(/\DirectionHidden\b/, "");
                        element.className += " DirectionHidden";
                    }
                }

                let edges: IEdge[] = currentState.currentNode.edges;
                for (let i: number = 0; i < edges.length; i++) {
                    let element: HTMLSpanElement = this.elements[edges[i].data.direction];
                    if (element == null) {
                        continue;
                    }

                    element.className =
                        element.className.replace(/\DirectionHidden\b/, "");
                }
            }
        });

        return;
    }

    public deactivate(): void {
        this.disposable.dispose();
        return;
    }

    public display(node: Node): void {
        return;
    }

    private move(direction: EdgeConstants.Direction): void {
        this.viewer.moveDir(direction).first().subscribe();
    }

    private createElement(direction: EdgeConstants.Direction): HTMLSpanElement {
        let element: HTMLSpanElement = document.createElement("span");

        let name: string = this.directionClassMappings[direction];
        element.className = `btn Direction Direction${name} DirectionHidden`;

        let move: (direction: EdgeConstants.Direction) => void = this.move.bind(this);
        let listener: () => void = () => { move(direction); };

        element.addEventListener("click", listener);

        return element;
    }
}

export default CssUI;
