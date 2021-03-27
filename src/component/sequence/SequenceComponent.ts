import * as vd from "virtual-dom";

import {
    combineLatest as observableCombineLatest,
    concat as observableConcat,
    merge as observableMerge,
    empty as observableEmpty,
    of as observableOf,
    Observable,
    Scheduler,
    Subject,
} from "rxjs";

import {
    auditTime,
    catchError,
    debounceTime,
    distinctUntilChanged,
    filter,
    map,
    publish,
    publishReplay,
    refCount,
    retry,
    share,
    skip,
    startWith,
    switchMap,
    take,
    takeUntil,
    withLatestFrom,
} from "rxjs/operators";

import { Node } from "../../graph/Node";
import { Container } from "../../viewer/Container";
import { Navigator } from "../../viewer/Navigator";
import { GraphMode } from "../../graph/GraphMode";
import { NavigationEdgeStatus } from "../../graph/interfaces/NavigationEdgeStatus";
import { Sequence } from "../../graph/Sequence";
import { ViewportSize } from "../../render/interfaces/ViewportSize";
import { VirtualNodeHash } from "../../render/interfaces/VirtualNodeHash";
import { State } from "../../state/State";
import { SequenceConfiguration } from "../interfaces/SequenceConfiguration";
import { SequenceDOMRenderer } from "./SequenceDOMRenderer";
import { NavigationDirection } from "../../graph/edge/NavigationDirection";
import { Component } from "../Component";
import { ComponentEvent } from "../events/ComponentEvent";
import {
    ComponentHoverEvent,
    ComponentPlayEvent,
    ComponentStateEvent,
} from "../events/ComponentStateEvent";

/**
 * @class SequenceComponent
 * @classdesc Component showing navigation arrows for sequence directions
 * as well as playing button. Exposes an API to start and stop play.
 */
export class SequenceComponent extends Component<SequenceConfiguration> {
    /** @inheritdoc */
    public static componentName: string = "sequence";

    private _sequenceDOMRenderer: SequenceDOMRenderer;
    private _scheduler: Scheduler;

    private _hoveredIdSubject$: Subject<string>;
    private _hoveredId$: Observable<string>;
    private _containerWidth$: Subject<number>;

    constructor(
        name: string,
        container: Container,
        navigator: Navigator,
        renderer?: SequenceDOMRenderer,
        scheduler?: Scheduler) {

        super(name, container, navigator);

        this._sequenceDOMRenderer = !!renderer ? renderer : new SequenceDOMRenderer(container);
        this._scheduler = scheduler;

        this._containerWidth$ = new Subject<number>();
        this._hoveredIdSubject$ = new Subject<string>();

        this._hoveredId$ = this._hoveredIdSubject$.pipe(share());

        this._navigator.playService.playing$.pipe(
            skip(1),
            withLatestFrom(this._configuration$))
            .subscribe(
                ([playing, configuration]: [boolean, SequenceConfiguration]): void => {
                    const type: ComponentEvent = "playing";
                    const event: ComponentPlayEvent = {
                        playing,
                        target: this,
                        type,
                    };
                    this.fire(type, event);

                    if (playing === configuration.playing) {
                        return;
                    }

                    if (playing) {
                        this.play();
                    } else {
                        this.stop();
                    }
                });

        this._navigator.playService.direction$.pipe(
            skip(1),
            withLatestFrom(this._configuration$))
            .subscribe(
                ([direction, configuration]: [NavigationDirection, SequenceConfiguration]): void => {
                    if (direction !== configuration.direction) {
                        this.configure({ direction });
                    }
                });
    }

    /** @inheritdoc */
    public off(
        type: "hover",
        handler: (event: ComponentHoverEvent) => void)
        : void;
    public off(
        type: "playing",
        handler: (event: ComponentPlayEvent) => void)
        : void;
    public off<T>(
        type: ComponentEvent,
        handler: (event: T) => void): void {
        super.off(type, handler);
    }

    /** @inheritdoc */
    public on(
        type: "hover",
        handler: (event: ComponentHoverEvent) => void)
        : void;
    public on(
        type: "playing",
        handler: (event: ComponentPlayEvent) => void)
        : void;
    public on<T>(
        type: ComponentEvent,
        handler: (event: T) => void): void {
        super.on(type, handler);
    }

    /**
     * Start playing.
     *
     * @fires playing
     */
    public play(): void { this.configure({ playing: true }); }

    /**
     * Stop playing.
     *
     * @fires playing
     */
    public stop(): void { this.configure({ playing: false }); }

    protected _activate(): void {
        this._sequenceDOMRenderer.activate();

        const edgeStatus$ = this._navigator.stateService.currentNode$.pipe(
            switchMap(
                (node: Node): Observable<NavigationEdgeStatus> => {
                    return node.sequenceEdges$;
                }),
            publishReplay(1),
            refCount());

        const sequence$ = this._navigator.stateService.currentNode$.pipe(
            distinctUntilChanged(
                undefined,
                (node: Node): string => {
                    return node.sequenceId;
                }),
            switchMap(
                (node: Node): Observable<Sequence> => {
                    return observableConcat(
                        observableOf(null),
                        this._navigator.graphService.cacheSequence$(node.sequenceId).pipe(
                            retry(3),
                            catchError(
                                (e: Error): Observable<Sequence> => {
                                    console.error("Failed to cache sequence", e);

                                    return observableOf(null);
                                })));
                }),
            startWith(null),
            publishReplay(1),
            refCount());

        const subs = this._subscriptions;

        subs.push(sequence$.subscribe());

        const rendererId$ = this._sequenceDOMRenderer.index$.pipe(
            withLatestFrom(sequence$),
            map(
                ([index, sequence]: [number, Sequence]): string => {
                    return sequence != null ? sequence.imageIds[index] : null;
                }),
            filter(
                (id: string): boolean => {
                    return !!id;
                }),
            distinctUntilChanged(),
            publish(),
            refCount());

        subs.push(observableMerge(
            rendererId$.pipe(debounceTime(100, this._scheduler)),
            rendererId$.pipe(auditTime(400, this._scheduler))).pipe(
                distinctUntilChanged(),
                switchMap(
                    (id: string): Observable<Node> => {
                        return this._navigator.moveTo$(id).pipe(
                            catchError(
                                (): Observable<Node> => {
                                    return observableEmpty();
                                }));
                    }))
            .subscribe());

        subs.push(this._sequenceDOMRenderer.changingPositionChanged$.pipe(
            filter(
                (changing: boolean): boolean => {
                    return changing;
                }))
            .subscribe(
                (): void => {
                    this._navigator.graphService.setGraphMode(GraphMode.Sequence);
                }));

        subs.push(this._sequenceDOMRenderer.changingPositionChanged$.pipe(
            filter(
                (changing: boolean): boolean => {
                    return !changing;
                }))
            .subscribe(
                (): void => {
                    this._navigator.graphService.setGraphMode(GraphMode.Spatial);
                }));

        this._navigator.graphService.graphMode$.pipe(
            switchMap(
                (mode: GraphMode): Observable<Node> => {
                    return mode === GraphMode.Spatial ?
                        this._navigator.stateService.currentNode$.pipe(
                            take(2)) :
                        observableEmpty();
                }),
            filter(
                (node: Node): boolean => {
                    return !node.spatialEdges.cached;
                }),
            switchMap(
                (node: Node): Observable<Node> => {
                    return this._navigator.graphService.cacheNode$(node.id).pipe(
                        catchError(
                            (): Observable<Node> => {
                                return observableEmpty();
                            }));
                }))
            .subscribe();

        subs.push(this._sequenceDOMRenderer.changingPositionChanged$.pipe(
            filter(
                (changing: boolean): boolean => {
                    return changing;
                }))
            .subscribe(
                (): void => {
                    this._navigator.playService.stop();
                }));

        subs.push(observableCombineLatest(
            this._navigator.graphService.graphMode$,
            this._sequenceDOMRenderer.changingPositionChanged$.pipe(
                startWith(false),
                distinctUntilChanged())).pipe(
                    withLatestFrom(this._navigator.stateService.currentNode$),
                    switchMap(
                        ([[mode, changing], node]: [[GraphMode, boolean], Node]): Observable<Sequence> => {
                            return changing && mode === GraphMode.Sequence ?
                                this._navigator.graphService.cacheSequenceNodes$(node.sequenceId, node.id).pipe(
                                    retry(3),
                                    catchError(
                                        (error: Error): Observable<Sequence> => {
                                            console.error("Failed to cache sequence nodes.", error);

                                            return observableEmpty();
                                        })) :
                                observableEmpty();
                        }))
            .subscribe());

        const position$: Observable<{ index: number, max: number }> = sequence$.pipe(
            switchMap(
                (sequence: Sequence): Observable<{ index: number, max: number }> => {
                    if (!sequence) {
                        return observableOf({ index: null, max: null });
                    }

                    let firstCurrentId: boolean = true;

                    return this._sequenceDOMRenderer.changingPositionChanged$.pipe(
                        startWith(false),
                        distinctUntilChanged(),
                        switchMap(
                            (changingPosition: boolean): Observable<string> => {
                                const skipCount: number =
                                    !changingPosition &&
                                        firstCurrentId ?
                                        0 : 1;
                                firstCurrentId = false;

                                return changingPosition ?
                                    rendererId$ :
                                    this._navigator.stateService.currentNode$.pipe(
                                        map(
                                            (node: Node): string => {
                                                return node.id;
                                            }),
                                        distinctUntilChanged(),
                                        skip(skipCount));
                            }),
                        map(
                            (imageId: string): { index: number, max: number } => {
                                const index: number = sequence.imageIds.indexOf(imageId);

                                if (index === -1) {
                                    return { index: null, max: null };
                                }

                                return { index: index, max: sequence.imageIds.length - 1 };
                            }));
                }));

        const earth$ = this._navigator.stateService.state$.pipe(
            map(
                (state: State): boolean => {
                    return state === State.Earth;
                }),
            distinctUntilChanged());

        subs.push(observableCombineLatest(
            edgeStatus$,
            this._configuration$,
            this._containerWidth$,
            this._sequenceDOMRenderer.changed$.pipe(startWith(this._sequenceDOMRenderer)),
            this._navigator.playService.speed$,
            position$,
            earth$).pipe(
                map(
                    (
                        [edgeStatus, configuration, containerWidth, , speed, position, earth]:
                            [
                                NavigationEdgeStatus,
                                SequenceConfiguration,
                                number,
                                SequenceDOMRenderer,
                                number,
                                { index: number, max: number },
                                boolean,
                            ]): VirtualNodeHash => {

                        const vNode: vd.VNode = this._sequenceDOMRenderer
                            .render(
                                edgeStatus,
                                configuration,
                                containerWidth,
                                speed,
                                position.index,
                                position.max,
                                !earth,
                                this,
                                this._navigator);

                        return { name: this._name, vnode: vNode };
                    }))
            .subscribe(this._container.domRenderer.render$));

        subs.push(this._sequenceDOMRenderer.speed$
            .subscribe(
                (speed: number): void => {
                    this._navigator.playService.setSpeed(speed);
                }));

        subs.push(this._configuration$.pipe(
            map(
                (configuration: SequenceConfiguration): NavigationDirection => {
                    return configuration.direction;
                }),
            distinctUntilChanged())
            .subscribe(
                (direction: NavigationDirection): void => {
                    this._navigator.playService.setDirection(direction);
                }));

        subs.push(observableCombineLatest(
            this._container.renderService.size$,
            this._configuration$.pipe(
                distinctUntilChanged(
                    (value1: [number, number], value2: [number, number]): boolean => {
                        return value1[0] === value2[0] && value1[1] === value2[1];
                    },
                    (configuration: SequenceConfiguration) => {
                        return [configuration.minWidth, configuration.maxWidth];
                    }))).pipe(
                        map(
                            ([size, configuration]: [ViewportSize, SequenceConfiguration]): number => {
                                return this._sequenceDOMRenderer.getContainerWidth(
                                    size,
                                    configuration);
                            }))
            .subscribe(this._containerWidth$));

        subs.push(this._configuration$.pipe(
            map(
                (configuration: SequenceConfiguration): boolean => {
                    return configuration.playing;
                }),
            distinctUntilChanged())
            .subscribe(
                (playing: boolean) => {
                    if (playing) {
                        this._navigator.playService.play();
                    } else {
                        this._navigator.playService.stop();
                    }
                }));

        subs.push(this._sequenceDOMRenderer.mouseEnterDirection$.pipe(
            switchMap(
                (direction: NavigationDirection): Observable<string> => {
                    const edgeTo$: Observable<string> = edgeStatus$.pipe(
                        map(
                            (edgeStatus: NavigationEdgeStatus): string => {
                                for (let edge of edgeStatus.edges) {
                                    if (edge.data.direction === direction) {
                                        return edge.target;
                                    }
                                }

                                return null;
                            }),
                        takeUntil(this._sequenceDOMRenderer.mouseLeaveDirection$));

                    return observableConcat(edgeTo$, observableOf<string>(null));
                }),
            distinctUntilChanged())
            .subscribe(this._hoveredIdSubject$));

        subs.push(this._hoveredId$
            .subscribe(
                (id: string): void => {
                    const type: ComponentEvent = "hover";
                    const event: ComponentHoverEvent = {
                        id,
                        target: this,
                        type,
                    }
                    this.fire(type, event);
                }));
    }

    protected _deactivate(): void {
        this._subscriptions.unsubscribe();
        this._sequenceDOMRenderer.deactivate();
    }

    protected _getDefaultConfiguration(): SequenceConfiguration {
        return {
            direction: NavigationDirection.Next,
            maxWidth: 108,
            minWidth: 70,
            playing: false,
            visible: true,
        };
    }
}
