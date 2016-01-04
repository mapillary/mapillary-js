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
    private playing: boolean;

    constructor () {
        this.currentNode = null;
        this.playing =  false;
    }

    public activate(navigator: Navigator): void {
        this.navigator = navigator;

        this.disposable = this.navigator.stateService.currentState.subscribe((currentState: ICurrentState) => {
            if (!this.playing) {
                return;
            }
            if (currentState != null && currentState.currentNode != null) {
                if (currentState.nextNodes.length < 5) {
                    this.currentNode = currentState.currentNode;
                    this.getNbrNexts(currentState.nextNodes[currentState.nextNodes.length - 1]);
                }
            }
        });
    }

    public deactivate(): void {
        this.disposable.dispose();
    }

    public play(): void {
        this.playing =  true;
    }

    public stop(): void {
        this.playing =  false;
        this.navigator.stateService.startMove([]);
    }

    private getNbrNexts(node: Node): void {
        this.navigator.graphService.getNextNode(node, EdgeConstants.Direction.NEXT)
            .first()
            .subscribe((nextNode: Node) => {
                this.navigator.stateService.appendMove([nextNode]);
            });
    }
}

export default SimplePlayBot;
