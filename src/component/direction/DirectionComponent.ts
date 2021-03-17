import * as vd from "virtual-dom";

import {
    combineLatest as observableCombineLatest,
    of as observableOf,
    Observable,
    Subscription,
    Subject,
} from "rxjs";

import {
    catchError,
    distinctUntilChanged,
    filter,
    map,
    share,
    startWith,
    switchMap,
    tap,
    withLatestFrom,
} from "rxjs/operators";

import { Component } from "../Component";

import { Node } from "../../graph/Node";
import { Container } from "../../viewer/Container";
import { Navigator } from "../../viewer/Navigator";
import { NavigationEdgeStatus } from "../../graph/interfaces/NavigationEdgeStatus";
import { Sequence } from "../../graph/Sequence";
import { ViewportSize } from "../../render/interfaces/ViewportSize";
import { VirtualNodeHash } from "../../render/interfaces/VirtualNodeHash";
import { RenderCamera } from "../../render/RenderCamera";
import { DirectionConfiguration } from "../interfaces/DirectionConfiguration";
import { DirectionDOMRenderer } from "./DirectionDOMRenderer";

/**
 * @class DirectionComponent
 * @classdesc Component showing navigation arrows for steps and turns.
 */
export class DirectionComponent extends Component<DirectionConfiguration> {
    /** @inheritdoc */
    public static componentName: string = "direction";

    /**
     * Event fired when the hovered id changes.
     *
     * @description Emits the id of the node for the direction
     * arrow that is being hovered. When the mouse leaves a
     * direction arrow null is emitted.
     *
     * @event DirectionComponent#hoveredidchanged
     * @type {string} The hovered id, null if no id is hovered.
     */
    public static hoveredidchanged: string = "hoveredidchanged";

    private _renderer: DirectionDOMRenderer;

    private _hoveredIdSubject$: Subject<string>;
    private _hoveredId$: Observable<string>;

    private _configurationSubscription: Subscription;
    private _emitHoveredIdSubscription: Subscription;
    private _hoveredIdSubscription: Subscription;
    private _nodeSubscription: Subscription;
    private _renderCameraSubscription: Subscription;
    private _resizeSubscription: Subscription;

    constructor(name: string, container: Container, navigator: Navigator, directionDOMRenderer?: DirectionDOMRenderer) {
        super(name, container, navigator);

        this._renderer = !!directionDOMRenderer ?
            directionDOMRenderer :
            new DirectionDOMRenderer(
                this.defaultConfiguration,
                { height: container.container.offsetHeight, width: container.container.offsetWidth });

        this._hoveredIdSubject$ = new Subject<string>();

        this._hoveredId$ = this._hoveredIdSubject$.pipe(share());
    }

    /**
     * Get hovered id observable.
     *
     * @description An observable emitting the id of the node for the direction
     * arrow that is being hovered. When the mouse leaves a direction arrow null
     * is emitted.
     *
     * @returns {Observable<string>}
     */
    public get hoveredId$(): Observable<string> {
        return this._hoveredId$;
    }

    /**
     * Set highlight id.
     *
     * @description The arrow pointing towards the node corresponding to the
     * highlight id will be highlighted.
     *
     * @param {string} highlightId id of node to be highlighted if existing
     * among arrows.
     */
    public setHighlightId(highlightId: string): void {
        this.configure({ highlightId: highlightId });
    }

    /**
     * Set min width of container element.
     *
     * @description  Set min width of the non transformed container element holding
     * the navigation arrows. If the min width is larger than the max width the
     * min width value will be used.
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
     * Set max width of container element.
     *
     * @description Set max width of the non transformed container element holding
     * the navigation arrows. If the min width is larger than the max width the
     * min width value will be used.
     *
     * The container element is automatically resized when the resize
     * method on the Viewer class is called.
     *
     * @param {number} minWidth
     */
    public setMaxWidth(maxWidth: number): void {
        this.configure({ maxWidth: maxWidth });
    }

    protected _activate(): void {
        this._configurationSubscription = this._configuration$
            .subscribe(
                (configuration: DirectionConfiguration): void => {
                    this._renderer.setConfiguration(configuration);
                });

        this._resizeSubscription = this._container.renderService.size$
            .subscribe(
                (size: ViewportSize): void => {
                    this._renderer.resize(size);
                });

        this._nodeSubscription = this._navigator.stateService.currentNode$.pipe(
            tap(
                (node: Node): void => {
                    this._container.domRenderer.render$.next({ name: this._name, vnode: vd.h("div", {}, []) });
                    this._renderer.setNode(node);
                }),
            withLatestFrom(this._configuration$),
            switchMap(
                ([node, configuration]: [Node, DirectionConfiguration]): Observable<[NavigationEdgeStatus, Sequence]> => {
                    return observableCombineLatest(
                        node.spatialEdges$,
                        configuration.distinguishSequence ?
                            this._navigator.graphService
                                .cacheSequence$(node.sequenceId).pipe(
                                    catchError(
                                        (error: Error): Observable<Sequence> => {
                                            console.error(`Failed to cache sequence (${node.sequenceId})`, error);

                                            return observableOf<Sequence>(null);
                                        })) :
                            observableOf<Sequence>(null));
                }))
            .subscribe(
                ([edgeStatus, sequence]: [NavigationEdgeStatus, Sequence]): void => {
                    this._renderer.setEdges(edgeStatus, sequence);
                });

        this._renderCameraSubscription = this._container.renderService.renderCameraFrame$.pipe(
            tap(
                (renderCamera: RenderCamera): void => {
                    this._renderer.setRenderCamera(renderCamera);
                }),
            map(
                (): DirectionDOMRenderer => {
                    return this._renderer;
                }),
            filter(
                (renderer: DirectionDOMRenderer): boolean => {
                    return renderer.needsRender;
                }),
            map(
                (renderer: DirectionDOMRenderer): VirtualNodeHash => {
                    return { name: this._name, vnode: renderer.render(this._navigator) };
                }))
            .subscribe(this._container.domRenderer.render$);

        this._hoveredIdSubscription = observableCombineLatest(
            this._container.domRenderer.element$,
            this._container.renderService.renderCamera$,
            this._container.mouseService.mouseMove$.pipe(startWith(null)),
            this._container.mouseService.mouseUp$.pipe(startWith(null))).pipe(
                map(
                    ([element]: [Element, RenderCamera, MouseEvent, MouseEvent]): string => {
                        let elements: HTMLCollectionOf<Element> =
                            <HTMLCollectionOf<Element>>element.getElementsByClassName("mapillary-direction-perspective");

                        for (let i: number = 0; i < elements.length; i++) {
                            let hovered: Element = elements.item(i).querySelector(":hover");

                            if (hovered != null && hovered.hasAttribute("data-id")) {
                                return hovered.getAttribute("data-id");
                            }
                        }

                        return null;
                    }),
                distinctUntilChanged())
            .subscribe(this._hoveredIdSubject$);

        this._emitHoveredIdSubscription = this._hoveredId$
            .subscribe(
                (id: string): void => {
                    this.fire(DirectionComponent.hoveredidchanged, id);
                });
    }

    protected _deactivate(): void {
        this._configurationSubscription.unsubscribe();
        this._emitHoveredIdSubscription.unsubscribe();
        this._hoveredIdSubscription.unsubscribe();
        this._nodeSubscription.unsubscribe();
        this._renderCameraSubscription.unsubscribe();
        this._resizeSubscription.unsubscribe();
    }

    protected _getDefaultConfiguration(): DirectionConfiguration {
        return {
            distinguishSequence: false,
            maxWidth: 460,
            minWidth: 260,
        };
    }
}
