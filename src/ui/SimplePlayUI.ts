/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />

import * as rx from "rx";

import {EdgeDirection} from "../Edge";
import {Node} from "../Graph";
import {IFrame} from "../State";
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
        this.disposable = this.navigator.stateService.currentState$.subscribe((frame: IFrame) => {
            if (!this.playing) {
                return;
            }
            if (frame.state != null && frame.state.currentNode != null) {
                let l: number = frame.state.trajectory.length;
                if (l - frame.state.currentIndex < 5) {
                    this.currentNode = frame.state.currentNode;
                    this.getNbrNexts(frame.state.trajectory[l - 1]);
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
