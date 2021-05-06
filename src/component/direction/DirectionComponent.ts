import * as vd from "virtual-dom";
import {
    combineLatest as observableCombineLatest,
    of as observableOf,
    Observable,
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

import { Image } from "../../graph/Image";
import { Container } from "../../viewer/Container";
import { Navigator } from "../../viewer/Navigator";
import { NavigationEdgeStatus }
    from "../../graph/interfaces/NavigationEdgeStatus";
import { Sequence } from "../../graph/Sequence";
import { ViewportSize } from "../../render/interfaces/ViewportSize";
import { VirtualNodeHash } from "../../render/interfaces/VirtualNodeHash";
import { RenderCamera } from "../../render/RenderCamera";
import { Component } from "../Component";
import { DirectionConfiguration } from "../interfaces/DirectionConfiguration";
import { DirectionDOMRenderer } from "./DirectionDOMRenderer";
import { ComponentEventType } from "../events/ComponentEventType";
import { ComponentHoverEvent } from "../events/ComponentHoverEvent";
import { ComponentStateEvent } from "../events/ComponentStateEvent";
import { ComponentName } from "../ComponentName";

/**
 * @class DirectionComponent
 * @classdesc Component showing navigation arrows for steps and turns.
 */
export class DirectionComponent extends Component<DirectionConfiguration> {
    /** @inheritdoc */
    public static componentName: ComponentName = "direction";

    private _renderer: DirectionDOMRenderer;

    private _hoveredIdSubject$: Subject<string>;
    private _hoveredId$: Observable<string>;

    /** @ignore */
    constructor(
        name: string,
        container: Container,
        navigator: Navigator,
        directionDOMRenderer?: DirectionDOMRenderer) {

        super(name, container, navigator);

        this._renderer = !!directionDOMRenderer ?
            directionDOMRenderer :
            new DirectionDOMRenderer(
                this.defaultConfiguration,
                { height: container.container.offsetHeight, width: container.container.offsetWidth });

        this._hoveredIdSubject$ = new Subject<string>();

        this._hoveredId$ = this._hoveredIdSubject$.pipe(share());
    }

    public fire(
        type: "hover",
        event: ComponentHoverEvent)
        : void;
    /** @ignore */
    public fire(
        type: ComponentEventType,
        event: ComponentStateEvent)
        : void;
    public fire<T>(
        type: ComponentEventType,
        event: T): void {
        super.fire(type, event);
    }

    public off(
        type: "hover",
        handler: (event: ComponentHoverEvent) => void)
        : void;
    /** @ignore */
    public off(
        type: ComponentEventType,
        handler: (event: ComponentStateEvent) => void)
        : void;
    public off<T>(
        type: ComponentEventType,
        handler: (event: T) => void): void {
        super.off(type, handler);
    }

    /**
     * Fired when the hovered element of a component changes.
     *
     * @event hover
     * @example
     * ```js
     * // Initialize the viewer
     * var viewer = new Viewer({ // viewer options });
     * var component = viewer.getComponent('<component-name>');
     * // Set an event listener
     * component.on('hover', function() {
     *   console.log("A hover event has occurred.");
     * });
     * ```
     */
    public on(
        type: "hover",
        handler: (event: ComponentHoverEvent) => void)
        : void;
    /** @ignore */
    public on(
        type: ComponentEventType,
        handler: (event: ComponentStateEvent) => void)
        : void;
    public on<T>(
        type: ComponentEventType,
        handler: (event: T) => void): void {
        super.on(type, handler);
    }

    protected _activate(): void {
        const subs = this._subscriptions;

        subs.push(this._configuration$
            .subscribe(
                (configuration: DirectionConfiguration): void => {
                    this._renderer.setConfiguration(configuration);
                }));

        subs.push(this._container.renderService.size$
            .subscribe(
                (size: ViewportSize): void => {
                    this._renderer.resize(size);
                }));

        subs.push(this._navigator.stateService.currentImage$.pipe(
            tap(
                (image: Image): void => {
                    this._container.domRenderer.render$.next({ name: this._name, vNode: vd.h("div", {}, []) });
                    this._renderer.setImage(image);
                }),
            withLatestFrom(this._configuration$),
            switchMap(
                ([image, configuration]: [Image, DirectionConfiguration]): Observable<[NavigationEdgeStatus, Sequence]> => {
                    return observableCombineLatest(
                        image.spatialEdges$,
                        configuration.distinguishSequence ?
                            this._navigator.graphService
                                .cacheSequence$(image.sequenceId).pipe(
                                    catchError(
                                        (error: Error): Observable<Sequence> => {
                                            console.error(`Failed to cache sequence (${image.sequenceId})`, error);

                                            return observableOf<Sequence>(null);
                                        })) :
                            observableOf<Sequence>(null));
                }))
            .subscribe(
                ([edgeStatus, sequence]: [NavigationEdgeStatus, Sequence]): void => {
                    this._renderer.setEdges(edgeStatus, sequence);
                }));

        subs.push(this._container.renderService.renderCameraFrame$.pipe(
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
                    return { name: this._name, vNode: renderer.render(this._navigator) };
                }))
            .subscribe(this._container.domRenderer.render$));

        subs.push(observableCombineLatest(
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
            .subscribe(this._hoveredIdSubject$));

        subs.push(this._hoveredId$
            .subscribe(
                (id: string): void => {
                    const type: ComponentEventType = "hover";
                    const event: ComponentHoverEvent = {
                        id,
                        target: this,
                        type,
                    };
                    this.fire(type, event);
                }));
    }

    protected _deactivate(): void {
        this._subscriptions.unsubscribe();
    }

    protected _getDefaultConfiguration(): DirectionConfiguration {
        return {
            distinguishSequence: false,
            maxWidth: 460,
            minWidth: 260,
        };
    }
}
