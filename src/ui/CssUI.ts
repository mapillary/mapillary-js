/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />

import * as rx from "rx";

import {IEdge, EdgeConstants} from "../Edge";
import {Node, GraphService, MyGraph} from "../Graph";
import {IActivatableUI} from "../UI";
import {ICurrentState, StateService} from "../State";
import {Viewer} from "../Viewer";

export class CssUI implements IActivatableUI {
    public graphSupport: boolean = true;

    private container: HTMLElement;
    private disposable: rx.IDisposable;
    private stateService: StateService;
    private graphService: GraphService;
    private viewer: Viewer;

    private elements: { [direction: string]: HTMLButtonElement } = {};
    private directionClassMappings: { [direction: string]: string } = {};

    // inject viewer here --------------->
    constructor(container: HTMLElement, viewer: Viewer, stateService: StateService, graphService: GraphService) {
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
        this.graphService = graphService;
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
                let element: HTMLButtonElement = this.elements[k];
                this.container.appendChild(element);
             }
        }

        this.disposable = this.stateService.currentState.combineLatest(
            this.graphService.graph,
            (currentState: ICurrentState, graph: MyGraph) => {
                return [currentState, graph];
            }).subscribe((tuple: [ICurrentState, MyGraph]) => {
                let currentState: ICurrentState = tuple[0];
                let graph: MyGraph = tuple[1];

                if (currentState != null && currentState.currentNode != null) {
                    let edges: IEdge[] = graph.getEdges(currentState.currentNode);

                    for (let i: number = 0; i < edges.length; i++) {
                        console.log(edges[i].data.direction);
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

    private createElement(direction: EdgeConstants.Direction): HTMLButtonElement {
        let element: HTMLButtonElement = document.createElement("button");

        let name: string = this.directionClassMappings[direction];
        element.className = `btn Direction Direction${name}`;
        element.innerText = name[0];

        return element;
    }
}

export default CssUI;
