/// <reference path="../../typings/virtual-dom/virtual-dom.d.ts" />

import * as rx from "rx";

import {EdgeDirection} from "../Edge";
import {Node} from "../Graph";
import {IFrame} from "../State";
import {IComponentConfiguration, IPlayerConfiguration, ComponentService, Component} from "../Component";
import {Container, Navigator} from "../Viewer";

interface IConfigurationOperation {
    (configuration: IPlayerConfiguration): IPlayerConfiguration;
}

interface INodes {
    last: Node;
    next: Node;
}

export class PlayerComponent extends Component {
    public static componentName: string = "player";

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
            .scan<IPlayerConfiguration>(
                (configuration: IPlayerConfiguration, operation: IConfigurationOperation): IPlayerConfiguration => {
                    return operation(configuration);
                },
                { playing: false })
            .finally(
                (): void => {
                    if (this._playingSubscription != null) {
                        this._navigator.stateService.cutNodes();
                        this._stop();
                    }
                })
            .subscribe();

        this._configuration$
            .map<IConfigurationOperation>(
                (newConfiguration: IPlayerConfiguration) => {
                    return (configuration: IPlayerConfiguration): IPlayerConfiguration => {
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
                    return (configuration: IPlayerConfiguration): IPlayerConfiguration => {
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
        this.stop();

        this._configurationSubscription.dispose();
    }

    public get defaultConfiguration(): IComponentConfiguration {
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
                    return frame.state.nodesAhead < this.nodesAhead;
                })
            .distinctUntilChanged(
                 (frame: IFrame): string => {
                     return frame.state.lastNode.key;
                 })
            .map<Node>(
                (frame: IFrame): Node => {
                    return frame.state.lastNode;
                })
            .selectMany<Node>(
                (node: Node): rx.Observable<Node> => {
                    return this._navigator.graphService
                        .nextNode$(
                            node,
                            EdgeDirection.Next)
                        .withLatestFrom<IFrame, INodes>(
                            this._navigator.stateService.currentState$,
                            (next: Node, frame: IFrame): INodes => {
                                 return  { last: frame.state.lastNode, next: next };
                            })
                        .first()
                        .filter(
                            (nodes: INodes): boolean => {
                                return nodes.last.key === node.key;
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
            .subscribe(
                (node: Node): void => {
                    this._navigator.stateService.appendNodes([node]);
                });
    }

    private _stop(): void {
        this._playingSubscription.dispose();
        this._playingSubscription = null;
    }
}

ComponentService.register(PlayerComponent);
export default PlayerComponent;
