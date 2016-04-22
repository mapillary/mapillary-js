/// <reference path="../../typings/browser.d.ts" />

import * as rx from "rx";

import {EdgeDirection} from "../Edge";
import {Node} from "../Graph";
import {IFrame} from "../State";
import {IPlayerConfiguration, ComponentService, Component} from "../Component";
import {Container, Navigator} from "../Viewer";

interface IConfigurationOperation {
    (configuration: IPlayerConfiguration): IPlayerConfiguration;
}

export class PlayerComponent extends Component {
    public static componentName: string = "player";

    /**
     * Event fired when playing starts or stops.
     *
     * @event PlayerComponent#playingchanged
     * @type {boolean} Indicates whether the player is playing.
     */
    public static playingchanged: string = "playingchanged";

    private _configurationOperation$: rx.Subject<IConfigurationOperation> = new rx.Subject<IConfigurationOperation>();
    private _stop$: rx.Subject<void> = new rx.Subject<void>();

    private _configurationSubscription: rx.IDisposable;
    private _playingSubscription: rx.IDisposable;

    private _nodesAhead: number = 5;

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

    public get defaultConfiguration(): IPlayerConfiguration {
        return { direction: EdgeDirection.Next, playing: false };
    }

    /**
     * Start playing.
     *
     * @fires PlayerComponent#playingchanged
     */
    public play(): void {
        this.configure({ playing: true });
    }

    /**
     * Stop playing.
     *
     * @fires PlayerComponent#playingchanged
     */
    public stop(): void {
        this.configure({ playing: false });
    }

    /**
     * Set the direction to follow when started.
     *
     * @param {EdgeDirection} direction - The direction that will be followed when started.
     */
    public setDirection(direction: EdgeDirection): void {
        this.configure({ direction: direction });
    }

    private _play(): void {
        this._playingSubscription = this._navigator.stateService.currentState$
            .filter(
                (frame: IFrame): boolean => {
                    return frame.state.nodesAhead < this._nodesAhead;
                })
            .map<Node>(
                (frame: IFrame): Node => {
                    return frame.state.lastNode;
                })
            .distinctUntilChanged(
                 (lastNode: Node): string => {
                     return lastNode.key;
                 })
            .withLatestFrom(
                this._configuration$,
                (lastNode: Node, configuration: IPlayerConfiguration): [Node, EdgeDirection] => {
                    return [lastNode, configuration.direction];
                })
            .flatMapLatest<Node>(
                (nd: [Node, EdgeDirection]): rx.Observable<Node> => {
                    return this._navigator.graphService.nextNode$(nd[0], nd[1]);
                })
            .subscribe(
                (node: Node): void => {
                    this._navigator.stateService.appendNodes([node]);
                },
                (error: Error): void => {
                    this._stop$.onNext(null);
                }
            );

        this.fire(PlayerComponent.playingchanged, true);
    }

    private _stop(): void {
        this._playingSubscription.dispose();
        this._playingSubscription = null;

        this.fire(PlayerComponent.playingchanged, false);
    }
}

ComponentService.register(PlayerComponent);
export default PlayerComponent;
