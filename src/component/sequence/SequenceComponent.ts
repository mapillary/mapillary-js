/// <reference path="../../../typings/index.d.ts" />

import * as vd from "virtual-dom";

import {Observable} from "rxjs/Observable";
import {Subscription} from "rxjs/Subscription";
import {Subject} from "rxjs/Subject";

import "rxjs/add/observable/combineLatest";
import "rxjs/add/observable/of";

import "rxjs/add/operator/bufferCount";
import "rxjs/add/operator/concat";
import "rxjs/add/operator/distinctUntilChanged";
import "rxjs/add/operator/filter";
import "rxjs/add/operator/finally";
import "rxjs/add/operator/first";
import "rxjs/add/operator/map";
import "rxjs/add/operator/publishReplay";
import "rxjs/add/operator/scan";
import "rxjs/add/operator/share";
import "rxjs/add/operator/switchMap";
import "rxjs/add/operator/takeUntil";
import "rxjs/add/operator/withLatestFrom";

import {
    Component,
    ComponentService,
    ISequenceConfiguration,
    SequenceDOMRenderer,
    SequenceDOMInteraction,
} from "../../Component";
import {EdgeDirection} from "../../Edge";
import {IEdgeStatus, Node} from "../../Graph";
import {IVNodeHash} from "../../Render";
import {IFrame} from "../../State";
import {Container, Navigator} from "../../Viewer";

interface IConfigurationOperation {
    (configuration: ISequenceConfiguration): ISequenceConfiguration;
}

/**
 * @class SequenceComponent
 * @classdesc Component showing navigation arrows for sequence directions
 * as well as playing button. Exposes an API to start and stop play.
 */
export class SequenceComponent extends Component<ISequenceConfiguration> {
    /** @inheritdoc */
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

    private _configurationOperation$: Subject<IConfigurationOperation> = new Subject<IConfigurationOperation>();
    private _hoveredKeySubject$: Subject<string>;
    private _hoveredKey$: Observable<string>;
    private _containerWidth$: Subject<number>;
    private _edgeStatus$: Observable<IEdgeStatus>;

    private _configurationSubscription: Subscription;
    private _renderSubscription: Subscription;
    private _containerWidthSubscription: Subscription;
    private _hoveredKeySubscription: Subscription;

    private _playingSubscription: Subscription;
    private _clearSubscription: Subscription;
    private _stopSubscription: Subscription;

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);

        this._sequenceDOMRenderer = new SequenceDOMRenderer(container.element);
        this._sequenceDOMInteraction = new SequenceDOMInteraction();

        this._containerWidth$ = new Subject<number>();
        this._hoveredKeySubject$ = new Subject<string>();

        this._hoveredKey$ = this._hoveredKeySubject$.share();

        this._edgeStatus$ = this._navigator.stateService.currentNode$
            .switchMap(
                (node: Node): Observable<IEdgeStatus> => {
                    return node.sequenceEdges$;
                })
            .publishReplay(1)
            .refCount();
    }

    /**
     * Get hovered key observable.
     *
     * @description An observable emitting the key of the node for the direction
     * arrow that is being hovered. When the mouse leaves a direction arrow null
     * is emitted.
     *
     * @returns {Observable<string>}
     */
    public get hoveredKey$(): Observable<string> {
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

    /**
     * Set highlight key.
     *
     * @description The arrow pointing towards the node corresponding to the
     * highlight key will be highlighted.
     *
     * @param {string} highlightKey Key of node to be highlighted if existing.
     */
    public setHighlightKey(highlightKey: string): void {
        this.configure({ highlightKey: highlightKey });
    }

    /**
     * Set max width of container element.
     *
     * @description Set max width of the container element holding
     * the sequence navigation elements. If the min width is larger than the
     * max width the min width value will be used.
     *
     * The container element is automatically resized when the resize
     * method on the Viewer class is called.
     *
     * @param {number} minWidth
     */
    public setMaxWidth(maxWidth: number): void {
        this.configure({ maxWidth: maxWidth });
    }

    /**
     * Set min width of container element.
     *
     * @description Set min width of the container element holding
     * the sequence navigation elements. If the min width is larger than the
     * max width the min width value will be used.
     *
     * The container element is automatically resized when the resize
     * method on the Viewer class is called.
     *
     * @param {number} minWidth
     */
    public setMinWidth(minWidth: number): void {
        this.configure({ minWidth: minWidth });
    }

    /**
     * Set the value indicating whether the sequence UI elements should be visible.
     *
     * @param {boolean} visible
     */
    public setVisible(visible: boolean): void {
        this.configure({ visible: visible });
    }

    /** @inheritdoc */
    public resize(): void {
        this._configuration$
            .first()
            .map(
                (configuration: ISequenceConfiguration): number => {
                    return this._sequenceDOMRenderer.getContainerWidth(
                        this._container.element,
                        configuration);
                })
            .subscribe(
                (containerWidth: number): void => {
                    this._containerWidth$.next(containerWidth);
                });
    }

    protected _activate(): void {
        this._renderSubscription = Observable
            .combineLatest(
                this._edgeStatus$,
                this._configuration$,
                this._containerWidth$)
            .map(
                (ec: [IEdgeStatus, ISequenceConfiguration, number]): IVNodeHash => {
                    let edgeStatus: IEdgeStatus = ec[0];
                    let configuration: ISequenceConfiguration = ec[1];
                    let containerWidth: number = ec[2];

                    let vNode: vd.VNode = this._sequenceDOMRenderer
                        .render(
                            edgeStatus,
                            configuration,
                            containerWidth,
                            this,
                            this._sequenceDOMInteraction,
                            this._navigator);

                    return {name: this._name, vnode: vNode };
                })
            .subscribe(this._container.domRenderer.render$);

        this._containerWidthSubscription = this._configuration$
            .distinctUntilChanged(
                (value1: [number, number], value2: [number, number]): boolean => {
                    return value1[0] === value2[0] && value1[1] === value2[1];
                },
                (configuration: ISequenceConfiguration) => {
                    return [configuration.minWidth, configuration.maxWidth];
                })
            .map(
                (configuration: ISequenceConfiguration): number => {
                    return this._sequenceDOMRenderer.getContainerWidth(
                        this._container.element,
                        configuration);
                })
            .subscribe(this._containerWidth$);

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
            .subscribe(() => { /*noop*/ });

        this._configuration$
            .map(
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

        this._stopSubscription = this._configuration$
            .switchMap(
                (configuration: ISequenceConfiguration): Observable<[IEdgeStatus, EdgeDirection]> => {
                    let edgeStatus$: Observable<IEdgeStatus> = configuration.playing ?
                        this._edgeStatus$ :
                        Observable.empty<IEdgeStatus>();

                    let edgeDirection$: Observable<EdgeDirection> = Observable
                        .of(configuration.direction);

                    return Observable
                        .combineLatest<IEdgeStatus, EdgeDirection>(edgeStatus$, edgeDirection$);
                })
            .map(
                (ne: [IEdgeStatus, EdgeDirection]): boolean => {
                    let edgeStatus: IEdgeStatus = ne[0];
                    let direction: EdgeDirection = ne[1];

                    if (!edgeStatus.cached) {
                        return true;
                    }

                    for (let edge of edgeStatus.edges) {
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
            .map(
                (hasEdge: boolean): ISequenceConfiguration => {
                    return { playing: false };
                })
            .subscribe(this._configurationSubject$);

        this._hoveredKeySubscription = this._sequenceDOMInteraction.mouseEnterDirection$
            .switchMap(
                (direction: EdgeDirection): Observable<string> => {
                    return this._edgeStatus$
                        .map(
                            (edgeStatus: IEdgeStatus): string => {
                                for (let edge of edgeStatus.edges) {
                                    if (edge.data.direction === direction) {
                                        return edge.to;
                                    }
                                }

                                return null;
                            })
                        .takeUntil(this._sequenceDOMInteraction.mouseLeaveDirection$)
                        .concat<string>(Observable.of<string>(null));
                })
            .distinctUntilChanged()
            .subscribe(this._hoveredKeySubject$);
    }

    protected _deactivate(): void {
        this._stopSubscription.unsubscribe();
        this._renderSubscription.unsubscribe();
        this._configurationSubscription.unsubscribe();
        this._containerWidthSubscription.unsubscribe();
        this._hoveredKeySubscription.unsubscribe();

        this.stop();
    }

    protected _getDefaultConfiguration(): ISequenceConfiguration {
        return {
            direction: EdgeDirection.Next,
            maxWidth: 117,
            minWidth: 70,
            playing: false,
            visible: true,
        };
    }

    private _play(): void {
        this._playingSubscription = this._navigator.stateService.currentState$
            .filter(
                (frame: IFrame): boolean => {
                    return frame.state.nodesAhead < this._nodesAhead;
                })
            .map(
                (frame: IFrame): Node => {
                    return frame.state.lastNode;
                })
            .distinctUntilChanged(
                undefined,
                (lastNode: Node): string => {
                    return lastNode.key;
                })
            .withLatestFrom(
                this._configuration$,
                (lastNode: Node, configuration: ISequenceConfiguration): [Node, EdgeDirection] => {
                    return [lastNode, configuration.direction];
                })
            .switchMap(
                (nd: [Node, EdgeDirection]): Observable<[IEdgeStatus, EdgeDirection]> => {
                    return ([EdgeDirection.Next, EdgeDirection.Prev].indexOf(nd[1]) > -1 ?
                            nd[0].sequenceEdges$ :
                            nd[0].spatialEdges$)
                        .filter(
                            (status: IEdgeStatus): boolean => {
                                return status.cached;
                            })
                        .zip(
                            Observable.of<EdgeDirection>(nd[1]),
                            (status: IEdgeStatus, direction: EdgeDirection): [IEdgeStatus, EdgeDirection] => {
                                return [status, direction];
                            });
                })
            .map(
                (ed: [IEdgeStatus, EdgeDirection]): string => {
                    let direction: EdgeDirection = ed[1];

                    for (let edge of ed[0].edges) {
                        if (edge.data.direction === direction) {
                            return edge.to;
                        }
                    }

                    return null;
                })
            .filter(
                (key: string): boolean => {
                    return key != null;
                })
            .switchMap(
                (key: string): Observable<Node> => {
                    return this._navigator.graphService.cacheNode$(key);
                })
            .subscribe(
                (node: Node): void => {
                    this._navigator.stateService.appendNodes([node]);
                },
                (error: Error): void => {
                    console.error(error);
                    this.stop();
                });

        this._clearSubscription = this._navigator.stateService.currentNode$
            .bufferCount(1, 7)
            .subscribe(
                (nodes: Node[]): void => {
                    this._navigator.stateService.clearPriorNodes();
                });

        this.fire(SequenceComponent.playingchanged, true);
    }

    private _stop(): void {
        this._playingSubscription.unsubscribe();
        this._playingSubscription = null;

        this._clearSubscription.unsubscribe();
        this._clearSubscription = null;

        this.fire(SequenceComponent.playingchanged, false);
    }
}

ComponentService.register(SequenceComponent);
export default SequenceComponent;
