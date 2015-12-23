/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />

import * as rx from "rx";

import {IEdge} from "../Edge";
import {Node, GraphService, MyGraph} from "../Graph";
import {IActivatableUI} from "../UI";
import {ICurrentState, StateService} from "../State";
import * as _ from "underscore";

export class CssUI implements IActivatableUI {
    public graphSupport: boolean = true;

    private container: HTMLElement;
    private disposable: rx.IDisposable;
    private stateService: StateService;
    private graphService: GraphService;

    // inject viewer here --------------->
    constructor(container: HTMLElement, stateService: StateService, graphService: GraphService) {
        let uiContainer: HTMLElement = document.createElement("div");
        uiContainer.className = "CssUi";
        container.appendChild(uiContainer);

        this.container = uiContainer;
        this.stateService = stateService;
        this.graphService = graphService;
    }

    public activate(): void {
        this.disposable = this.stateService.currentState.subscribe((currentState: ICurrentState) => {
            if (currentState != null && currentState.currentNode != null) {
                // fixme: UPDATE DIRECTIONS HERE
                _.each(this.getDirectionsUi(), (direction: HTMLElement) => {
                    this.container.appendChild(direction);
                });
            }
        });

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

    private getDirectionsUi(): Array<HTMLElement> {
        let possibleDirections: Array<string> = ["Forward", "Backward", "Left", "Right", "Turnaround"];

        return _.map(possibleDirections, (str: string) => {
            let elem: HTMLElement = document.createElement("button");
            elem.className = `btn Direction Direction${str}`;
            elem.innerText = str[0];
            return elem;
        });

    }
}

export default CssUI;
