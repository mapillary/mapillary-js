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
    IInteraction,
    ITagConfiguration,
    PointGeometry,
    OutlineCreateTag,
    PolygonGeometry,
    RectGeometry,
    RenderTag,
    Tag,
    TagCreator,
    TagDOMRenderer,
    TagMode,
    TagOperation,
    TagScene,
    TagSet,
    VertexGeometry,
} from "../../Component";
import {
    Transform,
    ViewportCoords,
} from "../../Geo";
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

/**
 * @class TagComponent
 * @classdesc Component for showing and editing 2D tags with different geometries.
 */
export class TagComponent extends Component<ITagConfiguration> {
    /** @inheritdoc */
    public static componentName: string = "tag";

    /**
     * Event fired when creation starts and stops.
     *
     * @event TagComponent#modechanged
     * @type {boolean} Indicates whether the component is creating a tag.
     */
    public static modechanged: string = "modechanged";

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
     * @type {TagComponent} Tag component.
     */
    public static tagschanged: string = "tagschanged";

    private _tagDomRenderer: TagDOMRenderer;
    private _tagScene: TagScene;
    private _tagSet: TagSet;
    private _tagCreator: TagCreator;
    private _viewportCoords: ViewportCoords;

    private _renderTags$: Observable<RenderTag<Tag>[]>;
    private _tagChanged$: Observable<Tag>;
    private _renderTagGLChanged$: Observable<RenderTag<Tag>>;
    private _tagInterationInitiated$: Observable<string>;
    private _tagInteractionAbort$: Observable<void>;
    private _activeTag$: Observable<IInteraction>;

    private _basicClick$: Observable<number[]>;
    private _validBasicClick$: Observable<number[]>;

    private _createGeometryChanged$: Observable<OutlineCreateTag>;
    private _createGLObjectsChanged$: Observable<OutlineCreateTag>;
    private _tagCreated$: Observable<OutlineCreateTag>;
    private _vertexGeometryCreated$: Observable<Geometry>;
    private _pointGeometryCreated$: Subject<Geometry>;
    private _geometryCreated$: Observable<Geometry>;

    private _creating$: Observable<boolean>;
    private _creatingConfiguration$: Observable<ITagConfiguration>;

    private _claimMouseSubscription: Subscription;
    private _mouseDragSubscription: Subscription;
    private _unclaimMouseSubscription: Subscription;
    private _updateGLObjectsSubscription: Subscription;
    private _updateTagSceneSubscription: Subscription;

    private _stopCreateSubscription: Subscription;
    private _deleteCreatingSubscription: Subscription;
    private _createSubscription: Subscription;
    private _createPointSubscription: Subscription;
    private _setCreateVertexSubscription: Subscription;
    private _addPointSubscription: Subscription;
    private _deleteCreatedSubscription: Subscription;
    private _setGLCreateTagSubscription: Subscription;
    private _createGLObjectsChangedSubscription: Subscription;
    private _preventDefaultSubscription: Subscription;
    private _containerClassListSubscription: Subscription;

    private _domSubscription: Subscription;
    private _glSubscription: Subscription;

    private _geometryCreatedEventSubscription: Subscription;
    private _tagsChangedEventSubscription: Subscription;

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);

        this._tagDomRenderer = new TagDOMRenderer();
        this._tagScene = new TagScene();
        this._tagSet = new TagSet();
        this._tagCreator = new TagCreator(this, navigator);
        this._viewportCoords = new ViewportCoords();

        this._renderTags$ = this._tagSet.changed$
            .map(
                (tagSet: TagSet): RenderTag<Tag>[] => {
                    const tags: RenderTag<Tag>[] = tagSet.getAll();

                    // ensure that tags are always rendered in the same order
                    // to avoid hover tracking problems on first resize.
                    tags.sort(
                        (t1: RenderTag<Tag>, t2: RenderTag<Tag>): number => {
                            const id1: string = t1.tag.id;
                            const id2: string = t2.tag.id;

                            if (id1 < id2) {
                                return -1;
                            }

                            if (id1 > id2) {
                                return 1;
                            }

                            return 0;
                        });

                    return tags;
                })
            .share();

        this._tagChanged$ = this._renderTags$
            .switchMap(
                (tags: RenderTag<Tag>[]): Observable<Tag> => {
                    return Observable
                        .from(tags)
                        .mergeMap(
                            (tag: RenderTag<Tag>): Observable<Tag> => {
                                return Observable
                                    .merge(
                                        tag.tag.changed$,
                                        tag.tag.geometryChanged$);
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

        this._createGLObjectsChanged$ = this._tagCreator.tag$
            .switchMap(
                (tag: OutlineCreateTag): Observable<OutlineCreateTag> => {
                    return tag != null ?
                        tag.glObjectsChanged$ :
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
                    return c1.mode === c2.mode;
                },
                (configuration: ITagConfiguration): ITagConfiguration => {
                    return {
                        createColor: configuration.createColor,
                        mode: configuration.mode,
                    };
                })
            .publishReplay(1)
            .refCount();

        this._creating$ = this._creatingConfiguration$
            .map(
                (configuration: ITagConfiguration): boolean => {
                    return configuration.mode !== TagMode.Default;
                })
            .publishReplay(1)
            .refCount();

        this._creatingConfiguration$
            .subscribe(
                (configuration: ITagConfiguration): void => {
                    this.fire(TagComponent.modechanged, configuration.mode);
                });
    }

    public add(tags: Tag[]): void {
        this._navigator.stateService.currentTransform$
            .first()
            .subscribe(
                (transform: Transform): void => {
                    this._tagSet.add(tags, transform);

                    const renderTags: RenderTag<Tag>[] = tags
                        .map(
                            (tag: Tag): RenderTag<Tag> => {
                                return this._tagSet.get(tag.id);
                            });

                    this._tagScene.add(renderTags);
                });
    }

    public changeMode(mode: TagMode): void {
        this.configure({ mode: mode });
    }

    public get(tagId: string): Tag {
        const renderTag: RenderTag<Tag> = this._tagSet.get(tagId);

        return renderTag !== undefined ? renderTag.tag : undefined;
    }

    public getAll(): Tag[] {
        return this._tagSet
            .getAll()
            .map(
                (renderTag: RenderTag<Tag>): Tag => {
                    return renderTag.tag;
                });
    }

    public has(tagId: string): boolean {
        return this._tagSet.has(tagId);
    }

    public remove(tagIds: string[]): void {
        this._tagSet.remove(tagIds);
        this._tagScene.remove(tagIds);
    }

    public removeAll(): void {
        this._tagSet.removeAll();
        this._tagScene.removeAll();
    }

    protected _activate(): void {
        this._preventDefaultSubscription = this._activeTag$
            .switchMap(
                (interaction: IInteraction): Observable<MouseEvent> => {
                    return interaction.tag != null ?
                        this._container.mouseService.documentMouseMove$ :
                        Observable.empty<MouseEvent>();
                })
            .subscribe(
                (event: MouseEvent): void => {
                    event.preventDefault(); // prevent selection of content outside the viewer
                });

        this._geometryCreatedEventSubscription = this._geometryCreated$
            .subscribe(
                (geometry: Geometry): void => {
                    this.fire(TagComponent.geometrycreated, geometry);
                });

        this._tagsChangedEventSubscription = this._renderTags$
            .subscribe(
                (tags: RenderTag<Tag>[]): void => {
                    this.fire(TagComponent.tagschanged, this);
                });

        const transformChanged$: Observable<void> = this.configuration$
            .switchMap(
                (configuration: ITagConfiguration): Observable<void> => {
                    return configuration.mode !== TagMode.Default ?
                        this._navigator.stateService.currentTransform$
                            .map((n: Transform): void => { return null; }) :
                        Observable.empty<void>();
                })
            .publishReplay(1)
            .refCount();

        this._deleteCreatingSubscription = transformChanged$
            .skip(1)
            .subscribe(
                (): void => {
                    this._tagCreator.delete$.next(null);
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
                tagAborted$,
                tagCreated$,
                pointGeometryCreated$)
            .subscribe((): void => { this.changeMode(TagMode.Default); });

        const creatingStarted$: Observable<ITagConfiguration> = Observable
            .combineLatest(
                this._creatingConfiguration$,
                transformChanged$)
            .map(
                ([configuration]: [ITagConfiguration, void]): ITagConfiguration => {
                    return configuration;
                })
            .publishReplay(1)
            .refCount();

        this._createSubscription = creatingStarted$
            .switchMap(
                (configuration: ITagConfiguration): Observable<number[]> => {
                    return configuration.mode === TagMode.CreateRect ||
                        configuration.mode === TagMode.CreatePolygon ?
                        this._validBasicClick$.take(1) :
                        Observable.empty<number[]>();
                })
            .subscribe(this._tagCreator.create$);

        this._createPointSubscription = creatingStarted$
            .switchMap(
                (configuration: ITagConfiguration): Observable<number[]> => {
                    return configuration.mode === TagMode.CreatePoint ?
                        this._validBasicClick$.take(1) :
                        Observable.empty<number[]>();
                })
            .map(
                (basic: number[]): Geometry => {
                    return new PointGeometry(basic);
                })
            .subscribe(this._pointGeometryCreated$);

        const containerMouseMove$: Observable<MouseEvent> = Observable
            .merge(
                this._container.mouseService.mouseMove$,
                this._container.mouseService.domMouseMove$)
            .share();

        this._setCreateVertexSubscription = Observable
            .combineLatest<MouseEvent, OutlineCreateTag, RenderCamera>(
                containerMouseMove$,
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

        this._addPointSubscription = creatingStarted$
            .switchMap(
                (configuration: ITagConfiguration): Observable<number[]> => {
                    return configuration.mode === TagMode.CreateRect || configuration.mode === TagMode.CreatePolygon ?
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

        this._setGLCreateTagSubscription = this._tagCreator.tag$
            .subscribe(
                (tag: OutlineCreateTag): void => {
                    if (this._tagScene.hasCreateTag()) {
                        this._tagScene.removeCreateTag();
                    }

                    if (tag != null) {
                        this._tagScene.addCreateTag(tag);
                    }
                });

        this._createGLObjectsChangedSubscription = this._createGLObjectsChanged$
            .subscribe(
                (tag: OutlineCreateTag): void => {
                    this._tagScene.updateCreateTagObjects(tag);
                });

        this._claimMouseSubscription = this._tagInterationInitiated$
            .switchMap(
                (id: string): Observable<MouseEvent> => {
                    return containerMouseMove$
                        .takeUntil(this._tagInteractionAbort$)
                        .take(1);
                })
            .subscribe(
                (e: MouseEvent): void => {
                    this._container.mouseService.claimMouse(this._name, 1);
                });

        this._mouseDragSubscription = this._activeTag$
            .withLatestFrom(
                containerMouseMove$,
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
                            this._container.mouseService
                                .filtered$(
                                    this._name,
                                    this._container.mouseService.domMouseDrag$)
                                .filter(
                                    (event: MouseEvent): boolean => {
                                        return this._viewportCoords.insideElement(event, this._container.element);
                                    }));

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
            .filtered$(this._name, this._container.mouseService.domMouseDragEnd$)
            .subscribe((e: MouseEvent): void => {
                this._container.mouseService.unclaimMouse(this._name);
             });

        this._updateGLObjectsSubscription = this._renderTagGLChanged$
            .subscribe(
                (tag: RenderTag<Tag>): void => {
                    this._tagScene.updateObjects(tag);
                });

        this._updateTagSceneSubscription = this._tagChanged$
            .subscribe(
                (tag: Tag): void => {
                    this._tagScene.update();
                });

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
            .map(
                (args: [RenderCamera, ISpriteAtlas, RenderTag<Tag>[], Tag, OutlineCreateTag]):
                    IVNodeHash => {
                    return {
                        name: this._name,
                        vnode: this._tagDomRenderer.render(args[2], args[4], args[1], args[0].perspective),
                    };
                })
            .subscribe(this._container.domRenderer.render$);

        this._glSubscription = this._navigator.stateService.currentState$
            .map(
                (frame: IFrame): IGLRenderHash => {
                    const tagScene: TagScene = this._tagScene;

                    return {
                        name: this._name,
                        render: {
                            frameId: frame.id,
                            needsRender: tagScene.needsRender,
                            render: tagScene.render.bind(tagScene),
                            stage: GLRenderStage.Foreground,
                        },
                    };
                })
            .subscribe(this._container.glRenderer.render$);

        this._navigator.stateService.currentTransform$
            .first()
            .subscribe(
                (transform: Transform): void => {
                    this._tagSet.activate(transform);
                    this._tagScene.add(this._tagSet.getAll());
                });

    }

    protected _deactivate(): void {
        this._tagScene.clear();
        this._tagSet.deactivate();

        this._tagCreator.delete$.next(null);

        this._claimMouseSubscription.unsubscribe();
        this._mouseDragSubscription.unsubscribe();
        this._unclaimMouseSubscription.unsubscribe();
        this._updateGLObjectsSubscription.unsubscribe();
        this._updateTagSceneSubscription.unsubscribe();

        this._stopCreateSubscription.unsubscribe();
        this._deleteCreatingSubscription.unsubscribe();
        this._createSubscription.unsubscribe();
        this._createPointSubscription.unsubscribe();
        this._setCreateVertexSubscription.unsubscribe();
        this._addPointSubscription.unsubscribe();
        this._deleteCreatedSubscription.unsubscribe();
        this._setGLCreateTagSubscription.unsubscribe();
        this._createGLObjectsChangedSubscription.unsubscribe();
        this._preventDefaultSubscription.unsubscribe();
        this._containerClassListSubscription.unsubscribe();

        this._domSubscription.unsubscribe();
        this._glSubscription.unsubscribe();

        this._geometryCreatedEventSubscription.unsubscribe();
        this._tagsChangedEventSubscription.unsubscribe();

        this._container.element.classList.remove("component-tag-create");
    }

    protected _getDefaultConfiguration(): ITagConfiguration {
        return {
            createColor: 0xFFFFFF,
            mode: TagMode.Default,
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
