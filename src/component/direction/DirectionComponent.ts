import * as vd from "virtual-dom";

import {
    of as observableOf,
    combineLatest as observableCombineLatest,
    Observable,
    Subscription,
    Subject,
} from "rxjs";

import {
    switchMap,
    share,
    startWith,
    withLatestFrom,
    map,
    filter,
    distinctUntilChanged,
    tap,
    catchError,
} from "rxjs/operators";

import {
    ComponentService,
    Component,
    DirectionDOMRenderer,
    IDirectionConfiguration,
} from "../../Component";
import {IEdgeStatus, Node, Sequence} from "../../Graph";
import {
    ISize,
    IVNodeHash,
    RenderCamera,
} from "../../Render";
import {Container, Navigator} from "../../Viewer";

/**
 * @class DirectionComponent
 * @classdesc Component showing navigation arrows for steps and turns.
 */
export class DirectionComponent extends Component<IDirectionConfiguration> {
    /** @inheritdoc */
    public static componentName: string = "direction";

    /**
     * Event fired when the hovered key changes.
     *
     * @description Emits the key of the node for the direction
     * arrow that is being hovered. When the mouse leaves a
     * direction arrow null is emitted.
     *
     * @event DirectionComponent#hoveredkeychanged
     * @type {string} The hovered key, null if no key is hovered.
     */
    public static hoveredkeychanged: string = "hoveredkeychanged";

    private _renderer: DirectionDOMRenderer;

    private _hoveredKeySubject$: Subject<string>;
    private _hoveredKey$: Observable<string>;

    private _configurationSubscription: Subscription;
    private _emitHoveredKeySubscription: Subscription;
    private _hoveredKeySubscription: Subscription;
    private _nodeSubscription: Subscription;
    private _renderCameraSubscription: Subscription;
    private _resizeSubscription: Subscription;

    constructor(name: string, container: Container, navigator: Navigator, directionDOMRenderer?: DirectionDOMRenderer) {
        super(name, container, navigator);

        this._renderer = !!directionDOMRenderer ?
            directionDOMRenderer :
            new DirectionDOMRenderer(
                this.defaultConfiguration,
                { height: container.element.offsetHeight, width: container.element.offsetWidth });

        this._hoveredKeySubject$ = new Subject<string>();

        this._hoveredKey$ = this._hoveredKeySubject$.pipe(share());
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
     * Set highlight key.
     *
     * @description The arrow pointing towards the node corresponding to the
     * highlight key will be highlighted.
     *
     * @param {string} highlightKey Key of node to be highlighted if existing
     * among arrows.
     */
    public setHighlightKey(highlightKey: string): void {
        this.configure({ highlightKey: highlightKey });
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
                (configuration: IDirectionConfiguration): void => {
                    this._renderer.setConfiguration(configuration);
                });

        this._resizeSubscription = this._container.renderService.size$
            .subscribe(
                (size: ISize): void => {
                    this._renderer.resize(size);
                });

        this._nodeSubscription = this._navigator.stateService.currentNode$.pipe(
            tap(
                (node: Node): void => {
                    this._container.domRenderer.render$.next({name: this._name, vnode: vd.h("div", {}, [])});
                    this._renderer.setNode(node);
                }),
            withLatestFrom(this._configuration$),
            switchMap(
                ([node, configuration]: [Node, IDirectionConfiguration]): Observable<[IEdgeStatus, Sequence]> => {
                    return observableCombineLatest(
                            node.spatialEdges$,
                            configuration.distinguishSequence ?
                                this._navigator.graphService
                                    .cacheSequence$(node.sequenceKey).pipe(
                                    catchError(
                                        (error: Error, caught: Observable<Sequence>): Observable<Sequence> => {
                                            console.error(`Failed to cache sequence (${node.sequenceKey})`, error);

                                            return observableOf<Sequence>(null);
                                        })) :
                                observableOf<Sequence>(null));
                }))
            .subscribe(
                ([edgeStatus, sequence]: [IEdgeStatus, Sequence]): void => {
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
                (renderer: DirectionDOMRenderer): IVNodeHash => {
                    return { name: this._name, vnode: renderer.render(this._navigator) };
                }))
            .subscribe(this._container.domRenderer.render$);

        this._hoveredKeySubscription = observableCombineLatest(
                this._container.domRenderer.element$,
                this._container.renderService.renderCamera$,
                this._container.mouseService.mouseMove$.pipe(startWith(null)),
                this._container.mouseService.mouseUp$.pipe(startWith(null))).pipe(
            map(
                ([element]: [Element, RenderCamera, MouseEvent, MouseEvent]): string => {
                    let elements: HTMLCollectionOf<Element> =
                        <HTMLCollectionOf<Element>>element.getElementsByClassName("DirectionsPerspective");

                    for (let i: number = 0; i < elements.length; i++) {
                        let hovered: Element = elements.item(i).querySelector(":hover");

                        if (hovered != null && hovered.hasAttribute("data-key")) {
                            return hovered.getAttribute("data-key");
                        }
                    }

                    return null;
                }),
            distinctUntilChanged())
            .subscribe(this._hoveredKeySubject$);

        this._emitHoveredKeySubscription = this._hoveredKey$
            .subscribe(
                (key: string): void => {
                    this.fire(DirectionComponent.hoveredkeychanged, key);
                });
    }

    protected _deactivate(): void {
        this._configurationSubscription.unsubscribe();
        this._emitHoveredKeySubscription.unsubscribe();
        this._hoveredKeySubscription.unsubscribe();
        this._nodeSubscription.unsubscribe();
        this._renderCameraSubscription.unsubscribe();
    }

    protected _getDefaultConfiguration(): IDirectionConfiguration {
        return {
            distinguishSequence: false,
            maxWidth: 460,
            minWidth: 260,
        };
    }
}

ComponentService.register(DirectionComponent);
export default DirectionComponent;
