/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />

import * as _ from "underscore";
import * as rx from "rx";

import {IEdge} from "../Edge";
import {IBot} from "../Bot";
import {Node} from "../Graph";
import {ICurrentState} from "../State";
import {Navigator} from "../Viewer";

export class CacheBot implements IBot {
    private disposable: rx.IDisposable;
    private navigator: Navigator;
    private currentNode: Node;
    private playing: boolean;

    constructor () {
        this.currentNode = null;
        this.playing =  false;
    }

    public activate(navigator: Navigator): void {
        this.navigator = navigator;

        this.disposable = this.navigator.stateService.currentState.subscribe((currentState: ICurrentState) => {
            if (currentState != null && currentState.currentNode != null) {
                _.map(currentState.currentNode.edges, (edge: IEdge): void => {
                    this.navigator.graphService.getNode(edge.to).first().subscribe();
                });
            }
        });
    }

    public deactivate(): void {
        this.disposable.dispose();
    }
}

export default CacheBot;
