/// <reference path="../../typings/virtual-dom/virtual-dom.d.ts" />

import * as rx from "rx";

import {EdgeDirection} from "../Edge";
import {Node} from "../Graph";
import {IFrame} from "../State";
import {IUIConfiguration, IPlayerUIConfiguration, UIService, UI} from "../UI";
import {Container, Navigator} from "../Viewer";

export class PlayerUI extends UI {
    public static uiName: string = "player";
    private _disposable: rx.IDisposable;

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);
    }

    public _activate(): void {
        let lastNode: Node = null;

        this._disposable =
            this._navigator.stateService.currentState$
            .combineLatest(this._configuration$, (frame: IFrame, conf: IPlayerUIConfiguration): boolean => {
                if (conf.playing) {
                    if (lastNode !== frame.state.currentNode) {
                        lastNode = frame.state.currentNode;
                        this._navigator.graphService
                            .nextNode$(
                                frame.state.trajectory[frame.state.trajectory.length - 1],
                                EdgeDirection.NEXT).subscribe((nextNode: Node) => {
                                    this._navigator.stateService.appendNodes([nextNode]);
                                    console.log(`next node: ${nextNode.key}`);
                                });
                        console.log(frame.state.trajectory);
                    }
                }
                return true;
            }).subscribe();
    }

    public _deactivate(): void {
        this._disposable.dispose();
    }

    public get defaultConfiguration(): IUIConfiguration {
        return {playing: false};
    }

    public play(): void {
        this.configure({playing: true});
    }

    public stop(): void {
        this.configure({playing: false});
    }
}

UIService.register(PlayerUI);
export default PlayerUI;
