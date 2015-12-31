/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />

import * as rx from "rx";

// import {Node} from "../Graph";
import {IBot} from "../Bot";
import {EdgeConstants} from "../Edge";
import {Node} from "../Graph";
import {ICurrentState} from "../State";
import {Navigator} from "../Viewer";

export class SimplePlayBot implements IBot {
    private disposable: rx.IDisposable;
    private navigator: Navigator;
    private currentNode: Node;

    constructor () {
        this.currentNode = null;
    }

    public activate(navigator: Navigator): void {
        this.navigator = navigator;

        this.disposable = this.navigator.stateService.currentState.subscribe((currentState: ICurrentState) => {
            if (currentState != null && currentState.currentNode != null) {
                if (this.currentNode == null) {
                    this.currentNode = currentState.currentNode;
                    this.getNbrNexts(this.currentNode);
                }
                if (this.currentNode.key !== currentState.currentNode.key) {
                    this.currentNode = currentState.currentNode;
                    this.getNbrNexts(this.currentNode);
                }
            }
        });
    }

    public deactivate(): void {
        this.disposable.dispose();
    }

    public play(): void {
        console.log("PLAY");
    }

    public stop(): void {
        console.log("STOP");
    }

    private getNbrNexts(node: Node): void {
        this.navigator.graphService.getNextNode(node,
                                                EdgeConstants.Direction.NEXT)
            .first()
            .subscribe((nextNode: Node) => {
                console.log(`Append move ${nextNode.key}`);
                this.navigator.stateService.appendMove([nextNode]);
            });

    }
}

export default SimplePlayBot;
