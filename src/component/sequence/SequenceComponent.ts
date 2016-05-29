/// <reference path="../../../typings/browser.d.ts" />

import * as rx from "rx";
import * as vd from "virtual-dom";

import {
    Component,
    ComponentService,
    ISequenceConfiguration,
    SequenceDOMRenderer,
    SequenceDOMInteraction,
} from "../../Component";
import {EdgeDirection} from "../../Edge";
import {Node} from "../../Graph";
import {IVNodeHash} from "../../Render";
import {IFrame} from "../../State";
import {Container, Navigator} from "../../Viewer";

interface IConfigurationOperation {
    (configuration: ISequenceConfiguration): ISequenceConfiguration;
}

export class SequenceComponent extends Component {
    public static componentName: string = "sequence";

    /**
     * Event fired when playing starts or stops.
     *
     * @event PlayerComponent#playingchanged
     * @type {boolean} Indicates whether the player is playing.
     */
    public static playingchanged: string = "playingchanged";

    private _sequenceDOMRenderer: SequenceDOMRenderer;
    private _sequenceDOMInteraction: SequenceDOMInteraction;
    private _nodesAhead: number = 5;

    private _configurationOperation$: rx.Subject<IConfigurationOperation> = new rx.Subject<IConfigurationOperation>();
    private _stop$: rx.Subject<void> = new rx.Subject<void>();
    private _hoveredKey$: rx.Observable<string>;

    private _configurationSubscription: rx.IDisposable;
    private _renderSubscription: rx.IDisposable;

    private _playingSubscription: rx.IDisposable;
    private _stopSubscription: rx.IDisposable;

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);

        this._sequenceDOMRenderer = new SequenceDOMRenderer();
        this._sequenceDOMInteraction = new SequenceDOMInteraction();

        this._hoveredKey$ = this._sequenceDOMInteraction.mouseEnterDirection$
            .flatMapLatest<string>(
                (direction: EdgeDirection): rx.Observable<string> => {
                    return this._navigator.stateService.currentNode$
                        .map<string>(
                            (node: Node): string => {
                                for (let edge of node.edges) {
                                    if (edge.data.direction === direction) {
                                        return edge.to;
                                    }
                                }

                                return null;
                            })
                        .takeUntil(this._sequenceDOMInteraction.mouseLeaveDirection$)
                        .concat(rx.Observable.just<string>(null));
                })
            .distinctUntilChanged()
            .share();
    }

    public get defaultConfiguration(): ISequenceConfiguration {
        return { direction: EdgeDirection.Next, playing: false };
    }

    public get hoveredKey$(): rx.Observable<string> {
        return this._hoveredKey$;
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
     * Set the direction to follow when playing.
     *
     * @param {EdgeDirection} direction - The direction that will be followed when playing.
     */
    public setDirection(direction: EdgeDirection): void {
        this.configure({ direction: direction });
    }

    protected _activate(): void {
        this._renderSubscription = rx.Observable
            .combineLatest(
                this._navigator.stateService.currentNode$,
                this._configuration$,
                (node: Node, configuration: ISequenceConfiguration): [Node, ISequenceConfiguration] => {
                    return [node, configuration];
                })
            .map<IVNodeHash>(
                (nc: [Node, ISequenceConfiguration]): IVNodeHash => {
                    let node: Node = nc[0];
                    let configuration: ISequenceConfiguration = nc[1];

                    let vNode: vd.VNode = this._sequenceDOMRenderer
                        .render(node, configuration, this, this._sequenceDOMInteraction, this._navigator);

                    return {name: this._name, vnode: vNode };
                })
            .subscribe(this._container.domRenderer.render$);

        this._configurationSubscription = this._configurationOperation$
            .scan<ISequenceConfiguration>(
                (configuration: ISequenceConfiguration, operation: IConfigurationOperation): ISequenceConfiguration => {
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
                (newConfiguration: ISequenceConfiguration) => {
                    return (configuration: ISequenceConfiguration): ISequenceConfiguration => {
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
                    return (configuration: ISequenceConfiguration): ISequenceConfiguration => {
                        if (configuration.playing) {
                            this._stop();
                        }

                        configuration.playing = false;

                        return configuration;
                    };
                })
            .subscribe(this._configurationOperation$);

        this._stopSubscription = this._configuration$
            .flatMapLatest(
                (configuration: ISequenceConfiguration): rx.Observable<[Node, EdgeDirection]> => {
                    let node$: rx.Observable<Node> = configuration.playing ?
                        this._navigator.stateService.currentNode$ :
                        rx.Observable.empty<Node>();

                    let edgeDirection$: rx.Observable<EdgeDirection> = rx.Observable
                        .just(configuration.direction);

                    return rx.Observable.combineLatest(
                        node$,
                        edgeDirection$,
                        (n: Node, e: EdgeDirection): [Node, EdgeDirection] => {
                            return [n, e];
                        });
                })
            .map<boolean>(
                (ne: [Node, EdgeDirection]): boolean => {
                    let node: Node = ne[0];
                    let direction: EdgeDirection = ne[1];

                    for (let edge of node.edges) {
                        if (edge.data.direction === direction) {
                            return true;
                        }
                    }

                    return false;
                })
            .filter(
                (hasEdge: boolean): boolean => {
                    return !hasEdge;
                })
            .map<ISequenceConfiguration>(
                (hasEdge: boolean): ISequenceConfiguration => {
                    return { playing: false };
                })
            .subscribe(this._configurationSubject$);
    }

    protected _deactivate(): void {
        this.stop();

        this._stopSubscription.dispose();
        this._renderSubscription.dispose();
        this._configurationSubscription.dispose();
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
                (lastNode: Node, configuration: ISequenceConfiguration): [Node, EdgeDirection] => {
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

        this.fire(SequenceComponent.playingchanged, true);
    }

    private _stop(): void {
        this._playingSubscription.dispose();
        this._playingSubscription = null;

        this.fire(SequenceComponent.playingchanged, false);
    }
}

ComponentService.register(SequenceComponent);
export default SequenceComponent;
