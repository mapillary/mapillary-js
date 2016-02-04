/// <reference path="../../typings/virtual-dom/virtual-dom.d.ts" />

import * as rx from "rx";

import {EdgeDirection} from "../Edge";
import {Node} from "../Graph";
import {IFrame} from "../State";
import {IUIConfiguration, IPlayerUIConfiguration, UIService, UI} from "../UI";
import {Container, Navigator} from "../Viewer";

interface IConfigurationOperation {
    (configuration: IPlayerUIConfiguration): IPlayerUIConfiguration;
}

interface INodes {
    last: Node;
    next: Node;
}

export class PlayerUI extends UI {
    public static uiName: string = "player";

    private _configurationOperation$: rx.Subject<IConfigurationOperation> = new rx.Subject<IConfigurationOperation>();
    private _stop$: rx.Subject<void> = new rx.Subject<void>();

    private _configurationSubscription: rx.IDisposable;
    private _playingSubscription: rx.IDisposable;

    private nodesAhead: number = 5;

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);
    }

    protected _activate(): void {
        this._configurationSubscription = this._configurationOperation$
            .scan<IPlayerUIConfiguration>(
                (configuration: IPlayerUIConfiguration, operation: IConfigurationOperation): IPlayerUIConfiguration => {
                    return operation(configuration);
                },
                { playing: false })
            .subscribe();

        this._configuration$
            .map<IConfigurationOperation>(
                (newConfiguration: IPlayerUIConfiguration) => {
                    return (configuration: IPlayerUIConfiguration): IPlayerUIConfiguration => {
                        if (newConfiguration.playing !== configuration.playing) {

                            this._navigator.stateService.cutNodes();

                            if (newConfiguration.playing) {
                                this._play();
                            } else {
                                this._stop();
                            }
                        }

                        configuration.playing = newConfiguration.playing;

                        return configuration;
                    };
                })
            .subscribe(this._configurationOperation$);

        this._stop$
            .map<IConfigurationOperation>(
                () => {
                    return (configuration: IPlayerUIConfiguration): IPlayerUIConfiguration => {
                        if (configuration.playing) {
                            this._stop();
                        }

                        configuration.playing = false;

                        return configuration;
                    };
                })
            .subscribe(this._configurationOperation$);
    }

    protected _deactivate(): void {
        this._configurationSubscription.dispose();
        this._playingSubscription.dispose();
    }

    public get defaultConfiguration(): IUIConfiguration {
        return { playing: false };
    }

    public play(): void {
        this.configure({ playing: true });
    }

    public stop(): void {
        this.configure({ playing: false });
    }

    private _play(): void {
        this._playingSubscription = this._navigator.stateService.currentState$
            .filter(
                (frame: IFrame): boolean => {
                    return frame.id % 5 === 0;
                })
            .filter(
                (frame: IFrame): boolean => {
                    let nodesAhead: number = frame.state.trajectory.length - 1 - frame.state.currentIndex;

                    return nodesAhead < this.nodesAhead;
                })
            .selectMany<Node>(
                (frame: IFrame): rx.Observable<Node> => {
                    let originalLast: Node = frame.state.trajectory[frame.state.trajectory.length - 1];

                    return this._navigator.graphService
                        .nextNode$(
                            originalLast,
                            EdgeDirection.NEXT)
                        .withLatestFrom<IFrame, INodes>(
                            this._navigator.stateService.currentState$,
                            (next: Node, nextFrame: IFrame): INodes => {
                                let last: Node = nextFrame.state.trajectory[frame.state.trajectory.length - 1];

                                return  { last: last, next: next };
                            })
                        .first()
                        .filter(
                            (nodes: INodes): boolean => {
                                return nodes.last.key === originalLast.key;
                            })
                        .map<Node>(
                            (nodes: INodes): Node => {
                                return nodes.next;
                            });
                })
            .filter(
                (node: Node): boolean => {
                    if (node == null) {
                        this._stop$.onNext(null);
                    }

                    return node != null;
                })
            .distinctUntilChanged(
                (node: Node): string => {
                    return node.key;
                })
            .subscribe(
                (node: Node): void => {
                    this._navigator.stateService.appendNodes([node]);
                });
    }

    private _stop(): void {
        this._playingSubscription.dispose();
    }
}

UIService.register(PlayerUI);
export default PlayerUI;
