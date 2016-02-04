/// <reference path="../../typings/virtual-dom/virtual-dom.d.ts" />

import * as rx from "rx";

import {EdgeDirection} from "../Edge";
import {Node} from "../Graph";
import {IFrame} from "../State";
import {IUIConfiguration, IPlayerUIConfiguration, UIService, UI} from "../UI";
import {Container, Navigator} from "../Viewer";

interface IFrameConf {
    conf: IPlayerUIConfiguration;
    frame: IFrame;
}

export class PlayerUI extends UI {
    public static uiName: string = "player";

    private _disposable: rx.IDisposable;

    private nodesAhead: number = 5;

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);
    }

    protected _activate(): void {
        return;
    }

    protected _deactivate(): void {
        this._disposable.dispose();
    }

    public get defaultConfiguration(): IUIConfiguration {
        return {playing: false};
    }

    public play(): void {
        this.configure({playing: true});

        this._disposable = rx.Observable
            .combineLatest<IFrame, IPlayerUIConfiguration, IFrameConf>(
                this._navigator.stateService.currentState$,
                this._configuration$,
                (frame: IFrame, conf: IPlayerUIConfiguration): IFrameConf => {
                    return { conf: conf, frame: frame };
                })
            .filter(
                (fc: IFrameConf): boolean => {
                    return fc.conf.playing &&
                        fc.frame.state.trajectory.length - 1 - fc.frame.state.currentIndex < this.nodesAhead;
                })
            .selectMany<Node>(
                (fc: IFrameConf): rx.Observable<Node> => {
                    return this._navigator.graphService
                        .nextNode$(
                            fc.frame.state.trajectory[fc.frame.state.trajectory.length - 1],
                            EdgeDirection.NEXT)
                        .first();
                })
            .filter(
                (node: Node): boolean => {
                    if (node == null) {
                        this._stop();
                    }

                    return node != null;
                })
            .distinct(
                (node: Node): string => {
                    return node.key;
                })
            .subscribe(
                (node: Node): void => {
                    this._navigator.stateService.appendNodes([node]);
                });
    }

    public stop(): void {
        this._navigator.stateService.cutNodes();
    }

    private _stop(): void {
        this.configure({playing: false});

        this._disposable.dispose();
    }
}

UIService.register(PlayerUI);
export default PlayerUI;
