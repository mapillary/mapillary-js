/// <reference path="../../../typings/index.d.ts" />

import {Observable} from "rxjs/Observable";
import {Subscription} from "rxjs/Subscription";
import {Subject} from "rxjs/Subject";

import "rxjs/add/observable/combineLatest";
import "rxjs/add/observable/empty";
import "rxjs/add/observable/from";
import "rxjs/add/observable/merge";
import "rxjs/add/observable/of";

import "rxjs/add/operator/combineLatest";
import "rxjs/add/operator/concat";
import "rxjs/add/operator/distinctUntilChanged";
import "rxjs/add/operator/do";
import "rxjs/add/operator/filter";
import "rxjs/add/operator/map";
import "rxjs/add/operator/merge";
import "rxjs/add/operator/mergeMap";
import "rxjs/add/operator/publishReplay";
import "rxjs/add/operator/scan";
import "rxjs/add/operator/share";
import "rxjs/add/operator/skip";
import "rxjs/add/operator/skipUntil";
import "rxjs/add/operator/startWith";
import "rxjs/add/operator/switchMap";
import "rxjs/add/operator/take";
import "rxjs/add/operator/takeUntil";
import "rxjs/add/operator/withLatestFrom";

import {
    ComponentService,
    Component,
    Geometry,
    GeometryType,
    IInteraction,
    ITagConfiguration,
    PointGeometry,
    OutlineCreateTag,
    OutlineRenderTag,
    OutlineTag,
    PolygonGeometry,
    RectGeometry,
    RenderTag,
    SpotRenderTag,
    SpotTag,
    Tag,
    TagCreator,
    TagDOMRenderer,
    TagGLRenderer,
    TagOperation,
    TagSet,
    VertexGeometry,
} from "../../Component";
import {
    Transform,
    ViewportCoords,
} from "../../Geo";
import {Node} from "../../Graph";
import {
    GLRenderStage,
    IGLRenderHash,
    IVNodeHash,
    RenderCamera,
} from "../../Render";
import {IFrame} from "../../State";
import {
    Container,
    ISpriteAtlas,
    Navigator,
} from "../../Viewer";

interface ITagGLRendererOperation extends Function {
    (renderer: TagGLRenderer): TagGLRenderer;
}

/**
 * @class TagComponent
 * @classdesc Component for showing and editing tags with different geometries.
 */
export class TagComponent extends Component<ITagConfiguration> {
    /** @inheritdoc */
    public static componentName: string = "tag";

    /**
     * Event fired when creation starts and stops.
     *
     * @event TagComponent#creatingchanged
     * @type {boolean} Indicates whether the component is creating a tag.
     */
    public static creatingchanged: string = "creatingchanged";

    /**
     * Event fired when a geometry has been created.
     *
     * @event TagComponent#geometrycreated
     * @type {Geometry} Created geometry.
     */
    public static geometrycreated: string = "geometrycreated";

    /**
     * Event fired when the tags collection has changed.
     *
     * @event TagComponent#tagschanged
     * @type {Array<Tag>} Current array of tags.
     */
    public static tagschanged: string = "tagschanged";

    private _tagDomRenderer: TagDOMRenderer;
    private _tagSet: TagSet;
    private _tagCreator: TagCreator;
    private _viewportCoords: ViewportCoords;

    private _tagGlRendererOperation$: Subject<ITagGLRendererOperation>;
    private _tagGlRenderer$: Observable<TagGLRenderer>;

    private _tags$: Observable<Tag[]>;
    private _renderTags$: Observable<RenderTag<Tag>[]>;
    private _tagChanged$: Observable<Tag>;
    private _renderTagGLChanged$: Observable<RenderTag<Tag>>;
    private _tagInterationInitiated$: Observable<string>;
    private _tagInteractionAbort$: Observable<void>;
    private _activeTag$: Observable<IInteraction>;

    private _basicClick$: Observable<number[]>;
    private _validBasicClick$: Observable<number[]>;

    private _createGeometryChanged$: Observable<OutlineCreateTag>;
    private _tagCreated$: Observable<OutlineCreateTag>;
    private _vertexGeometryCreated$: Observable<Geometry>;
    private _pointGeometryCreated$: Subject<Geometry>;
    private _geometryCreated$: Observable<Geometry>;

    private _creating$: Observable<boolean>;
    private _creatingConfiguration$: Observable<ITagConfiguration>;

    private _claimMouseSubscription: Subscription;
    private _mouseDragSubscription: Subscription;
    private _unclaimMouseSubscription: Subscription;
    private _setTagsSubscription: Subscription;
    private _updateGLTagSubscription: Subscription;
    private _setNeedsRenderSubscription: Subscription;

    private _stopCreateSubscription: Subscription;
    private _creatorConfigurationSubscription: Subscription;
    private _createSubscription: Subscription;
    private _createPointSubscription: Subscription;
    private _setCreateVertexSubscription: Subscription;
    private _addPointSubscription: Subscription;
    private _deleteCreatedSubscription: Subscription;
    private _setGLCreateTagSubscription: Subscription;
    private _preventDefaultSubscription: Subscription;
    private _containerClassListSubscription: Subscription;

    private _domSubscription: Subscription;
    private _glSubscription: Subscription;

    private _geometryCreatedEventSubscription: Subscription;
    private _tagsChangedEventSubscription: Subscription;

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);

        this._tagDomRenderer = new TagDOMRenderer();
        this._tagSet = new TagSet();
        this._tagCreator = new TagCreator();
        this._viewportCoords = new ViewportCoords();

        this._tagGlRendererOperation$ = new Subject<ITagGLRendererOperation>();

        this._tagGlRenderer$ = this._tagGlRendererOperation$
            .startWith(
                (renderer: TagGLRenderer): TagGLRenderer => {
                    return renderer;
                })
            .scan(
                (renderer: TagGLRenderer, operation: ITagGLRendererOperation): TagGLRenderer => {
                    return operation(renderer);
                },
                new TagGLRenderer());

        this._tags$ = this._tagSet.tagData$
            .map(
                (tagData: { [id: string]: Tag }): Tag[] => {
                    let tags: Tag[] = [];

                    // ensure that tags are always rendered in the same order
                    // to avoid hover tracking problems on first resize.
                    for (let key of Object.keys(tagData).sort()) {
                        tags.push(tagData[key]);
                    }

                    return tags;
                })
            .share();

        this._renderTags$ = this.tags$
            .withLatestFrom(this._navigator.stateService.currentTransform$)
            .map(
                (args: [Tag[], Transform]): RenderTag<Tag>[] => {
                    let tags: Tag[] = args[0];
                    let transform: Transform = args[1];

                    let renderTags: RenderTag<Tag>[] = tags
                        .map(
                            (tag: Tag): RenderTag<Tag> => {
                                if (tag instanceof OutlineTag) {
                                    return new OutlineRenderTag(<OutlineTag>tag, transform);
                                } else if (tag instanceof SpotTag) {
                                    return new SpotRenderTag(<SpotTag>tag, transform);
                                }

                                throw new Error("Tag type not supported");
                            });

                    return renderTags;
                })
            .share();

        this._tagChanged$ = this._tags$
            .switchMap(
                (tags: Tag[]): Observable<Tag> => {
                    return Observable
                        .from(tags)
                        .mergeMap(
                            (tag: Tag): Observable<Tag> => {
                                return Observable
                                    .merge(
                                        tag.changed$,
                                        tag.geometryChanged$);
                            });
                })
            .share();

        this._renderTagGLChanged$ = this._renderTags$
            .switchMap(
                (tags: RenderTag<Tag>[]): Observable<RenderTag<Tag>> => {
                    return Observable
                        .from(tags)
                        .mergeMap(
                            (tag: RenderTag<Tag>): Observable<RenderTag<Tag>> => {
                                return tag.glObjectsChanged$;
                            });
                })
            .share();

        this._tagInterationInitiated$ = this._renderTags$
            .switchMap(
                (tags: RenderTag<Tag>[]): Observable<string> => {
                    return Observable
                        .from(tags)
                        .mergeMap(
                            (tag: RenderTag<Tag>): Observable<string> => {
                                return tag.interact$
                                    .map(
                                        (interaction: IInteraction): string => {
                                            return interaction.tag.id;
                                        });
                            });
                })
            .share();

        this._tagInteractionAbort$ = Observable
            .merge(this._container.mouseService.documentMouseUp$)
            .map((e: MouseEvent): void => { /* noop */ })
            .share();

        this._activeTag$ = this._renderTags$
            .switchMap(
                (tags: RenderTag<Tag>[]): Observable<IInteraction> => {
                    return Observable
                        .from(tags)
                        .mergeMap(
                            (tag: RenderTag<Tag>): Observable<IInteraction> => {
                                return tag.interact$;
                            });
                })
            .merge<IInteraction>(
                this._tagInteractionAbort$
                    .map(
                        (): IInteraction => {
                            return { offsetX: 0, offsetY: 0, operation: TagOperation.None, tag: null };
                        }))
            .share();

        this._createGeometryChanged$ = this._tagCreator.tag$
            .switchMap(
                (tag: OutlineCreateTag): Observable<OutlineCreateTag> => {
                    return tag != null ?
                        tag.geometryChanged$ :
                        Observable.empty<OutlineCreateTag>();
                })
            .share();

        this._tagCreated$ = this._tagCreator.tag$
            .switchMap(
                (tag: OutlineCreateTag): Observable<OutlineCreateTag> => {
                    return tag != null ?
                        tag.created$ :
                        Observable.empty<OutlineCreateTag>();
                })
            .share();

        this._vertexGeometryCreated$ = this._tagCreated$
            .map(
                (tag: OutlineCreateTag): Geometry => {
                    return tag.geometry;
                })
            .share();

        this._pointGeometryCreated$ = new Subject<Geometry>();

        this._geometryCreated$ = Observable
            .merge<Geometry>(
                this._vertexGeometryCreated$,
                this._pointGeometryCreated$)
             .share();

        this._basicClick$ = this._container.mouseService.staticClick$
            .withLatestFrom(
                this._container.renderService.renderCamera$,
                this._navigator.stateService.currentTransform$,
                (
                    event: MouseEvent,
                    renderCamera: RenderCamera,
                    transform: Transform):
                    [MouseEvent, RenderCamera, Transform] => {
                    return [event, renderCamera, transform];
                })
            .map(
                (ert: [MouseEvent, RenderCamera, Transform]): number[] => {
                    let event: MouseEvent = ert[0];
                    let camera: RenderCamera = ert[1];
                    let transform: Transform = ert[2];

                    let basic: number[] = this._mouseEventToBasic(
                        event,
                        this._container.element,
                        camera,
                        transform);

                    return basic;
                })
            .share();

        this._validBasicClick$ = this._basicClick$
            .filter(
                (basic: number[]): boolean => {
                    let x: number = basic[0];
                    let y: number = basic[1];

                    return 0 <= x && x <= 1 && 0 <= y && y <= 1;
                })
            .share();

        this._creatingConfiguration$ = this._configuration$
            .distinctUntilChanged(
                (c1: ITagConfiguration, c2: ITagConfiguration): boolean => {
                    return c1.creating === c2.creating && c1.createType === c2.createType;
                },
                (configuration: ITagConfiguration): ITagConfiguration => {
                    return {
                        createColor: configuration.createColor,
                        createType: configuration.createType,
                        creating: configuration.creating,
                    };
                })
            .publishReplay(1)
            .refCount();

        this._creating$ = this._creatingConfiguration$
            .map(
                (configuration: ITagConfiguration): boolean => {
                    return configuration.creating;
                })
            .publishReplay(1)
            .refCount();

        this._creating$
            .subscribe(
                (creating: boolean): void => {
                    this.fire(TagComponent.creatingchanged, creating);
                });
    }

    /**
     * Get tags observable.
     *
     * @description An observable emitting every time the items in the
     * tag array changes.
     *
     * @returns {Observable<Tag[]>}
     */
    public get tags$(): Observable<Tag[]> {
        return this._tags$;
    }

    /**
     * Get geometry created observable.
     *
     * @description An observable emitting every time a geometry
     * has been created.
     *
     * @returns {Observable<Geometry>}
     */
    public get geometryCreated$(): Observable<Geometry> {
        return this._geometryCreated$;
    }

    /**
     * Set the tags to display.
     *
     * @param {Tag[]} tags - The tags.
     */
    public setTags(tags: Tag[]): void {
        this._tagSet.set$.next(tags);
    }

    /**
     * Configure the component to enter create mode for
     * creating a geometry of a certain type.
     *
     * @description Supported geometry types are: rect
     *
     * @param {string} geometryType - String specifying the geometry type.
     */
    public startCreate(geometryType: GeometryType): void {
        this.configure({ createType: geometryType, creating: true });
    }

    /**
     * Configure the component to leave create mode.
     *
     * @description A non completed geometry will be removed.
     */
    public stopCreate(): void {
        this.configure({ createType: null, creating: false });
    }

    protected _activate(): void {
        this._preventDefaultSubscription = Observable.merge(
                this._container.mouseService.documentCanvasMouseDown$,
                this._container.mouseService.documentCanvasMouseMove$)
            .subscribe(
                (event: MouseEvent): void => {
                    event.preventDefault(); // prevent selection of content outside the viewer
                });

        this._geometryCreatedEventSubscription = this._geometryCreated$
            .subscribe(
                (geometry: Geometry): void => {
                    this.fire(TagComponent.geometrycreated, geometry);
                });

        this._tagsChangedEventSubscription = this._tags$
            .subscribe(
                (tags: Tag[]): void => {
                    this.fire(TagComponent.tagschanged, tags);
                });

        let nodeChanged$: Observable<void> = this.configuration$
            .switchMap(
                (configuration: ITagConfiguration): Observable<void> => {
                    return configuration.creating ?
                        this._navigator.stateService.currentNode$
                            .skip(1)
                            .take(1)
                            .map((n: Node): void => { return null; }) :
                        Observable.empty<void>();
                });

        let tagAborted$: Observable<void> = this._tagCreator.tag$
            .switchMap(
                (tag: OutlineCreateTag): Observable<void> => {
                    return tag != null ?
                        tag.aborted$
                            .map((t: OutlineCreateTag): void => { return null; }) :
                        Observable.empty<void>();
                });

        let tagCreated$: Observable<void> = this._tagCreated$
            .map((t: OutlineCreateTag): void => { return null; });

        let pointGeometryCreated$: Observable<void> = this._pointGeometryCreated$
            .map((p: PointGeometry): void => { return null; });

        this._stopCreateSubscription = Observable
            .merge(
                nodeChanged$,
                tagAborted$,
                tagCreated$,
                pointGeometryCreated$)
            .subscribe((): void => { this.stopCreate(); });

        this._creatorConfigurationSubscription = this._configuration$
            .subscribe(this._tagCreator.configuration$);

        this._createSubscription = this._creatingConfiguration$
            .switchMap(
                (configuration: ITagConfiguration): Observable<number[]> => {
                    return configuration.creating &&
                        configuration.createType === "rect" ||
                        configuration.createType === "polygon" ?
                        this._validBasicClick$.take(1) :
                        Observable.empty<number[]>();
                })
            .subscribe(this._tagCreator.create$);

        this._createPointSubscription = this._creatingConfiguration$
            .switchMap(
                (configuration: ITagConfiguration): Observable<number[]> => {
                    return configuration.creating &&
                        configuration.createType === "point" ?
                        this._validBasicClick$.take(1) :
                        Observable.empty<number[]>();
                })
            .map(
                (basic: number[]): Geometry => {
                    return new PointGeometry(basic);
                })
            .subscribe(this._pointGeometryCreated$);

        this._setCreateVertexSubscription = Observable
            .combineLatest<MouseEvent, OutlineCreateTag, RenderCamera>(
                this._container.mouseService.documentCanvasMouseMove$,
                this._tagCreator.tag$,
                this._container.renderService.renderCamera$)
            .filter(
                (etr: [MouseEvent, OutlineCreateTag, RenderCamera]): boolean => {
                    return etr[1] != null;
                })
            .withLatestFrom(
                this._navigator.stateService.currentTransform$,
                (etr: [MouseEvent, OutlineCreateTag, RenderCamera], transform: Transform):
                [MouseEvent, OutlineCreateTag, RenderCamera, Transform] => {
                    return [etr[0], etr[1], etr[2], transform];
                })
            .subscribe(
                (etrt: [MouseEvent, OutlineCreateTag, RenderCamera, Transform]): void => {
                    let event: MouseEvent = etrt[0];
                    let tag: OutlineCreateTag = etrt[1];
                    let camera: RenderCamera = etrt[2];
                    let transform: Transform = etrt[3];

                    let basic: number[] = this._mouseEventToBasic(
                        event,
                        this._container.element,
                        camera,
                        transform);

                    if (tag.geometry instanceof RectGeometry) {
                        tag.geometry.setVertex2d(3, basic, transform);
                    } else if (tag.geometry instanceof PolygonGeometry) {
                        tag.geometry.setVertex2d((<PolygonGeometry>tag.geometry).polygon.length - 2, basic, transform);
                    }
                });

        this._addPointSubscription = this._creatingConfiguration$
            .switchMap(
                (configuration: ITagConfiguration): Observable<number[]> => {
                    let createType: GeometryType = configuration.createType;

                    return configuration.creating &&
                        (createType === "rect" || createType === "polygon") ?
                        this._basicClick$.skipUntil(this._validBasicClick$).skip(1) :
                        Observable.empty<number[]>();
                })
            .withLatestFrom(
                this._tagCreator.tag$,
                (basic: number[], tag: OutlineCreateTag): [number[], OutlineCreateTag] => {
                    return [basic, tag];
                })
            .subscribe(
                (bt: [number[], OutlineCreateTag]): void => {
                    let basic: number[] = bt[0];
                    let tag: OutlineCreateTag = bt[1];

                    tag.addPoint(basic);
                });

        this._containerClassListSubscription = this._creating$
            .subscribe(
                (creating: boolean): void => {
                    if (creating) {
                        this._container.element.classList.add("component-tag-create");
                    } else {
                        this._container.element.classList.remove("component-tag-create");
                    }
                });

        this._deleteCreatedSubscription = this._creating$
            .subscribe(
                (creating: boolean): void => {
                    this._tagCreator.delete$.next(null);
                });

        this._setGLCreateTagSubscription = Observable
            .merge(
                this._tagCreator.tag$,
                this._createGeometryChanged$)
            .withLatestFrom(
                this._navigator.stateService.currentTransform$,
                (tag: OutlineCreateTag, transform: Transform): [OutlineCreateTag, Transform] => {
                    return [tag, transform];
                })
            .map(
                (tt: [OutlineCreateTag, Transform]): ITagGLRendererOperation => {
                    return (renderer: TagGLRenderer): TagGLRenderer => {
                        let tag: OutlineCreateTag = tt[0];
                        let transform: Transform = tt[1];

                        if (tag == null) {
                            renderer.removeCreateTag();
                        } else {
                            renderer.setCreateTag(tag, transform);
                        }

                        return renderer;
                    };
                })
            .subscribe(this._tagGlRendererOperation$);

        this._claimMouseSubscription = this._tagInterationInitiated$
            .switchMap(
                (id: string): Observable<MouseEvent> => {
                    return this._container.mouseService.documentCanvasMouseMove$
                        .takeUntil(this._tagInteractionAbort$)
                        .take(1);
                })
            .subscribe(
                (e: MouseEvent): void => {
                    this._container.mouseService.claimMouse(this._name, 1);
                });

        this._mouseDragSubscription = this._activeTag$
            .withLatestFrom(
                this._container.mouseService.documentCanvasMouseMove$,
                (a: IInteraction, e: MouseEvent): [IInteraction, MouseEvent] => {
                    return [a, e];
                })
            .switchMap(
                (args: [IInteraction, MouseEvent]): Observable<[MouseEvent, RenderCamera, IInteraction, Transform]> => {
                    let activeTag: IInteraction = args[0];
                    let mouseMove: MouseEvent = args[1];

                    if (activeTag.operation === TagOperation.None) {
                        return Observable.empty<[MouseEvent, RenderCamera, IInteraction, Transform]>();
                    }

                    let mouseDrag$: Observable<MouseEvent> = Observable
                        .of<MouseEvent>(mouseMove)
                        .concat<MouseEvent>(
                            this._container.mouseService.filtered$(
                                this._name,
                                this._container.mouseService.documentCanvasMouseDrag$));

                    return Observable
                        .combineLatest<MouseEvent, RenderCamera>(
                            mouseDrag$,
                            this._container.renderService.renderCamera$)
                        .withLatestFrom(
                            Observable.of(activeTag),
                            this._navigator.stateService.currentTransform$,
                            (
                                ec: [MouseEvent, RenderCamera],
                                a: IInteraction,
                                t: Transform):
                                [MouseEvent, RenderCamera, IInteraction, Transform] => {
                                return [ec[0], ec[1], a, t];
                            });
                })
            .subscribe(
                (args: [MouseEvent, RenderCamera, IInteraction, Transform]): void => {
                    let mouseEvent: MouseEvent = args[0];
                    let renderCamera: RenderCamera = args[1];
                    let activeTag: IInteraction = args[2];
                    let transform: Transform = args[3];

                    if (activeTag.operation === TagOperation.None) {
                        return;
                    }

                    let basic: number[] = this._mouseEventToBasic(
                        mouseEvent,
                        this._container.element,
                        renderCamera,
                        transform,
                        activeTag.offsetX,
                        activeTag.offsetY);

                    if (activeTag.operation === TagOperation.Centroid) {
                        activeTag.tag.geometry.setCentroid2d(basic, transform);
                    } else if (activeTag.operation === TagOperation.Vertex) {
                        let vertexGeometry: VertexGeometry = <VertexGeometry>activeTag.tag.geometry;
                        vertexGeometry.setVertex2d(activeTag.vertexIndex, basic, transform);
                    }
                });

        this._unclaimMouseSubscription = this._container.mouseService
            .filtered$(this._name, this._container.mouseService.documentCanvasMouseDragEnd$)
            .subscribe((e: MouseEvent): void => {
                this._container.mouseService.unclaimMouse(this._name);
             });

        this._setTagsSubscription = this._renderTags$
            .map(
                (tags: RenderTag<Tag>[]): ITagGLRendererOperation => {
                    return (renderer: TagGLRenderer): TagGLRenderer => {
                        renderer.setTags(tags);

                        return renderer;
                    };
                })
            .subscribe(this._tagGlRendererOperation$);

        this._updateGLTagSubscription = this._renderTagGLChanged$
            .map(
                (tag: RenderTag<Tag>): ITagGLRendererOperation => {
                    return (renderer: TagGLRenderer): TagGLRenderer => {
                        renderer.updateTag(tag);

                        return renderer;
                    };
                })
            .subscribe(this._tagGlRendererOperation$);

        this._setNeedsRenderSubscription = this._tagChanged$
            .map(
                (tag: Tag): ITagGLRendererOperation => {
                    return (renderer: TagGLRenderer): TagGLRenderer => {
                        renderer.setNeedsRender();

                        return renderer;
                    };
                })
            .subscribe(this._tagGlRendererOperation$);

        this._domSubscription = this._renderTags$
            .startWith([])
            .do(
                (tags: RenderTag<Tag>[]): void => {
                    this._container.domRenderer.render$.next({
                        name: this._name,
                        vnode: this._tagDomRenderer.clear(),
                    });
                })
            .combineLatest(
                this._container.renderService.renderCamera$,
                this._container.spriteService.spriteAtlas$,
                this._tagChanged$.startWith(null),
                this._tagCreator.tag$.merge(this._createGeometryChanged$).startWith(null),
                (renderTags: RenderTag<Tag>[], rc: RenderCamera, atlas: ISpriteAtlas, tag: Tag, ct: OutlineCreateTag):
                [RenderCamera, ISpriteAtlas, RenderTag<Tag>[], Tag, OutlineCreateTag] => {
                    return [rc, atlas, renderTags, tag, ct];
                })
            .withLatestFrom(
                this._navigator.stateService.currentTransform$,
                (args: [RenderCamera, ISpriteAtlas, RenderTag<Tag>[], Tag, OutlineCreateTag], transform: Transform):
                    [RenderCamera, ISpriteAtlas, RenderTag<Tag>[], Tag, OutlineCreateTag, Transform] => {
                    return [args[0], args[1], args[2], args[3], args[4], transform];
                })
            .map(
                (args: [RenderCamera, ISpriteAtlas, RenderTag<Tag>[], Tag, OutlineCreateTag, Transform]):
                    IVNodeHash => {
                    return {
                        name: this._name,
                        vnode: this._tagDomRenderer.render(args[2], args[4], args[1], args[0].perspective, args[5]),
                    };
                })
            .subscribe(this._container.domRenderer.render$);

        this._glSubscription = this._navigator.stateService.currentState$
            .withLatestFrom(
                this._tagGlRenderer$,
                (frame: IFrame, renderer: TagGLRenderer): [IFrame, TagGLRenderer] => {
                    return [frame, renderer];
                })
            .map(
                (fr: [IFrame, TagGLRenderer]): IGLRenderHash => {
                    let frame: IFrame = fr[0];
                    let renderer: TagGLRenderer = fr[1];

                    return {
                        name: this._name,
                        render: {
                            frameId: frame.id,
                            needsRender: renderer.needsRender,
                            render: renderer.render.bind(renderer),
                            stage: GLRenderStage.Foreground,
                        },
                    };
                })
            .subscribe(this._container.glRenderer.render$);
    }

    protected _deactivate(): void {
        this._tagGlRendererOperation$
            .next(
                (renderer: TagGLRenderer): TagGLRenderer => {
                    renderer.dispose();

                    return renderer;
                });

        this._tagSet.set$.next([]);
        this._tagCreator.delete$.next(null);

        this._claimMouseSubscription.unsubscribe();
        this._mouseDragSubscription.unsubscribe();
        this._unclaimMouseSubscription.unsubscribe();
        this._setTagsSubscription.unsubscribe();
        this._updateGLTagSubscription.unsubscribe();
        this._setNeedsRenderSubscription.unsubscribe();

        this._stopCreateSubscription.unsubscribe();
        this._creatorConfigurationSubscription.unsubscribe();
        this._createSubscription.unsubscribe();
        this._createPointSubscription.unsubscribe();
        this._setCreateVertexSubscription.unsubscribe();
        this._addPointSubscription.unsubscribe();
        this._deleteCreatedSubscription.unsubscribe();
        this._setGLCreateTagSubscription.unsubscribe();
        this._preventDefaultSubscription.unsubscribe();
        this._containerClassListSubscription.unsubscribe();

        this._domSubscription.unsubscribe();
        this._glSubscription.unsubscribe();

        this._geometryCreatedEventSubscription.unsubscribe();
        this._tagsChangedEventSubscription.unsubscribe();
    }

    protected _getDefaultConfiguration(): ITagConfiguration {
        return {
            createColor: 0xFFFFFF,
            creating: false,
        };
    }

    private _mouseEventToBasic(
        event: MouseEvent,
        element: HTMLElement,
        camera: RenderCamera,
        transform: Transform,
        offsetX?: number,
        offsetY?: number):
        number[] {

        offsetX = offsetX != null ? offsetX : 0;
        offsetY = offsetY != null ? offsetY : 0;

        const [canvasX, canvasY]: number[] = this._viewportCoords.canvasPosition(event, element);
        const basic: number[] =
            this._viewportCoords.canvasToBasic(
                canvasX - offsetX,
                canvasY - offsetY,
                element,
                transform,
                camera.perspective);

        return basic;
    }
}

ComponentService.register(TagComponent);
export default TagComponent;
