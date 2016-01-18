/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />

import * as rx from "rx";

import {EdgeDirection} from "../Edge";
import {Node} from "../Graph";
import {ICurrentState} from "../State";
import {IUI} from "../UI";
import {Container, Navigator} from "../Viewer";

export class SimplePlayUI implements IUI {
    private disposable: rx.IDisposable;
    private navigator: Navigator;
    private currentNode: Node;
    private playing: boolean;

    constructor (container: Container, navigator: Navigator) {
        this.navigator = navigator;
        this.currentNode = null;
        this.playing =  false;
    }

    public activate(): void {
        this.disposable = this.navigator.stateService.currentState$.subscribe((currentState: ICurrentState) => {
            if (!this.playing) {
                return;
            }
            if (currentState != null && currentState.currentNode != null) {
                let l: number = currentState.trajectory.length;
                if (l - currentState.currentIndex < 5) {
                    this.currentNode = currentState.currentNode;
                    this.getNbrNexts(currentState.trajectory[l - 1]);
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
        this.navigator.stateService.cutNodes();
    }

    private getNbrNexts(node: Node): void {
        this.navigator.graphService.nextNode$(node, EdgeDirection.NEXT)
            .first()
            .subscribe((nextNode: Node) => {
                this.navigator.stateService.appendNodes([nextNode]);
            });
    }
}

export default SimplePlayUI;
