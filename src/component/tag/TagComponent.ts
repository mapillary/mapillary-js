import {
    combineLatest as observableCombineLatest,
    empty as observableEmpty,
    merge as observableMerge,
    from as observableFrom,
    Observable,
    Subscription,
} from "rxjs";

import {
    startWith,
    first,
    tap,
    map,
    share,
    skipWhile,
    filter,
    mergeMap,
    refCount,
    publishReplay,
    switchMap,
    distinctUntilChanged,
} from "rxjs/operators";

import * as when from "when";

import {
    ComponentService,
    Component,
    CreateHandlerBase,
    CreatePointHandler,
    CreatePolygonHandler,
    CreateRectHandler,
    CreateRectDragHandler,
    CreateTag,
    EditVertexHandler,
    Geometry,
    ITagConfiguration,
    RenderTag,
    Tag,
    TagCreator,
    TagDOMRenderer,
    TagMode,
    TagScene,
    TagSet,
    CreatePointsHandler,
} from "../../Component";
import {
    Transform,
    ViewportCoords,
} from "../../Geo";
import {
    GLRenderStage,
    IGLRenderHash,
    ISize,
    IVNodeHash,
    RenderCamera,
} from "../../Render";
import { IFrame } from "../../State";
import {
    Container,
    ISpriteAtlas,
    Navigator,
} from "../../Viewer";
import PointsGeometry from "./geometry/PointsGeometry";

/**
 * @class TagComponent
 *
 * @classdesc Component for showing and editing tags with different
 * geometries composed from 2D basic image coordinates (see the
 * {@link Viewer} class documentation for more information about coordinate
 * systems).
 *
 * The `add` method is used for adding new tags or replacing
 * tags already in the set. Tags are removed by id.
 *
 * If a tag already in the set has the same
 * id as one of the tags added, the old tag will be removed and
 * the added tag will take its place.
 *
 * The tag component mode can be set to either be non interactive or
 * to be in creating mode of a certain geometry type.
 *
 * The tag properties can be updated at any time and the change will
 * be visibile immediately.
 *
 * Tags are only relevant to a single image because they are based on
 * 2D basic image coordinates. Tags related to a certain image should
 * be removed when the viewer is moved to another node.
 *
 * To retrive and use the tag component
 *
 * @example
 * ```
 * var viewer = new Mapillary.Viewer({ component: { tag: true } }, ...);
 *
 * var tagComponent = viewer.getComponent("tag");
 * ```
 */
export class TagComponent extends Component<ITagConfiguration> {
    /** @inheritdoc */
    public static componentName: string = "tag";

    /**
     * Event fired when an interaction to create a geometry ends.
     *
     * @description A create interaction can by a geometry being created
     * or by the creation being aborted.
     *
     * @event TagComponent#creategeometryend
     * @type {TagComponent} Tag component.
     * @example
     * ```
     * tagComponent.on("creategeometryend", function(component) {
     *     console.log(component);
     * });
     * ```
     */
    public static creategeometryend: string = "creategeometryend";

    /**
     * Event fired when an interaction to create a geometry starts.
     *
     * @description A create interaction starts when the first vertex
     * is created in the geometry.
     *
     * @event TagComponent#creategeometrystart
     * @type {TagComponent} Tag component.
     * @example
     * ```
     * tagComponent.on("creategeometrystart", function(component) {
     *     console.log(component);
     * });
     * ```
     */
    public static creategeometrystart: string = "creategeometrystart";

    /**
     * Event fired when the create mode is changed.
     *
     * @event TagComponent#modechanged
     * @type {TagMode} Tag mode
     * @example
     * ```
     * tagComponent.on("modechanged", function(mode) {
     *     console.log(mode);
     * });
     * ```
     */
    public static modechanged: string = "modechanged";

    /**
     * Event fired when a geometry has been created.
     *
     * @event TagComponent#geometrycreated
     * @type {Geometry} Created geometry.
     * @example
     * ```
     * tagComponent.on("geometrycreated", function(geometry) {
     *     console.log(geometry);
     * });
     * ```
     */
    public static geometrycreated: string = "geometrycreated";

    /**
     * Event fired when the tags collection has changed.
     *
     * @event TagComponent#tagschanged
     * @type {TagComponent} Tag component.
     * @example
     * ```
     * tagComponent.on("tagschanged", function(component) {
     *     console.log(component.getAll());
     * });
     * ```
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
    private _createGeometryChanged$: Observable<CreateTag<Geometry>>;
    private _createGLObjectsChanged$: Observable<CreateTag<Geometry>>;

    private _creatingConfiguration$: Observable<ITagConfiguration>;

    private _updateGLObjectsSubscription: Subscription;
    private _updateTagSceneSubscription: Subscription;

    private _stopCreateSubscription: Subscription;
    private _setGLCreateTagSubscription: Subscription;
    private _createGLObjectsChangedSubscription: Subscription;

    private _handlerStopCreateSubscription: Subscription;
    private _handlerEnablerSubscription: Subscription;

    private _domSubscription: Subscription;
    private _glSubscription: Subscription;

    private _fireCreateGeometryEventSubscription: Subscription;
    private _fireGeometryCreatedSubscription: Subscription;
    private _fireTagsChangedSubscription: Subscription;

    private _createHandlers: { [K in keyof typeof TagMode]: CreateHandlerBase };
    private _editVertexHandler: EditVertexHandler;

    /** @ignore */
    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);

        this._tagDomRenderer = new TagDOMRenderer();
        this._tagScene = new TagScene();
        this._tagSet = new TagSet();
        this._tagCreator = new TagCreator(this, navigator);
        this._viewportCoords = new ViewportCoords();

        this._createHandlers = {
            "CreatePoint": new CreatePointHandler(this, container, navigator, this._viewportCoords, this._tagCreator),
            "CreatePoints": new CreatePointsHandler(this, container, navigator, this._viewportCoords, this._tagCreator),
            "CreatePolygon": new CreatePolygonHandler(this, container, navigator, this._viewportCoords, this._tagCreator),
            "CreateRect": new CreateRectHandler(this, container, navigator, this._viewportCoords, this._tagCreator),
            "CreateRectDrag": new CreateRectDragHandler(this, container, navigator, this._viewportCoords, this._tagCreator),
            "Default": undefined,
        };

        this._editVertexHandler = new EditVertexHandler(this, container, navigator, this._viewportCoords, this._tagSet);

        this._renderTags$ = this._tagSet.changed$.pipe(
            map(
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
                }),
            share());

        this._tagChanged$ = this._renderTags$.pipe(
            switchMap(
                (tags: RenderTag<Tag>[]): Observable<Tag> => {
                    return observableFrom(tags).pipe(
                        mergeMap(
                            (tag: RenderTag<Tag>): Observable<Tag> => {
                                return observableMerge(
                                    tag.tag.changed$,
                                    tag.tag.geometryChanged$);
                            }));
                }),
            share());

        this._renderTagGLChanged$ = this._renderTags$.pipe(
            switchMap(
                (tags: RenderTag<Tag>[]): Observable<RenderTag<Tag>> => {
                    return observableFrom(tags).pipe(
                        mergeMap(
                            (tag: RenderTag<Tag>): Observable<RenderTag<Tag>> => {
                                return tag.glObjectsChanged$;
                            }));
                }),
            share());

        this._createGeometryChanged$ = this._tagCreator.tag$.pipe(
            switchMap(
                (tag: CreateTag<Geometry>): Observable<CreateTag<Geometry>> => {
                    return tag != null ?
                        tag.geometryChanged$ :
                        observableEmpty();
                }),
            share());

        this._createGLObjectsChanged$ = this._tagCreator.tag$.pipe(
            switchMap(
                (tag: CreateTag<Geometry>): Observable<CreateTag<Geometry>> => {
                    return tag != null ?
                        tag.glObjectsChanged$ :
                        observableEmpty();
                }),
            share());

        this._creatingConfiguration$ = this._configuration$.pipe(
            distinctUntilChanged(
                (c1: ITagConfiguration, c2: ITagConfiguration): boolean => {
                    return c1.mode === c2.mode;
                },
                (configuration: ITagConfiguration): ITagConfiguration => {
                    return {
                        createColor: configuration.createColor,
                        mode: configuration.mode,
                    };
                }),
            publishReplay(1),
            refCount());

        this._creatingConfiguration$
            .subscribe(
                (configuration: ITagConfiguration): void => {
                    this.fire(TagComponent.modechanged, configuration.mode);
                });
    }

    /**
     * Add tags to the tag set or replace tags in the tag set.
     *
     * @description If a tag already in the set has the same
     * id as one of the tags added, the old tag will be removed
     * the added tag will take its place.
     *
     * @param {Array<Tag>} tags - Tags to add.
     *
     * @example ```tagComponent.add([tag1, tag2]);```
     */
    public add(tags: Tag[]): void {
        if (this._activated) {
            this._navigator.stateService.currentTransform$.pipe(
                first())
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
        } else {
            this._tagSet.addDeactivated(tags);
        }
    }

    /**
     * Calculate the smallest rectangle containing all the points
     * in the points geometry.
     *
     * @description The result may be different depending on if the
     * current node is an equirectangular panorama or not. If the
     * current node is an equirectangular panorama the rectangle may
     * wrap the horizontal border of the image.
     *
     * @returns {Promise<Array<number>>} Promise to the rectangle
     * on the format specified for the {@link RectGeometry} in basic
     * coordinates.
     */
    public calculateRect(geometry: PointsGeometry): when.Promise<number[]> {
        return when.promise<number[]>((resolve: (value: number[]) => void, reject: (reason: Error) => void): void => {
            this._navigator.stateService.currentTransform$.pipe(
                first(),
                map(
                    (transform: Transform): number[] => {
                        return geometry.getRect2d(transform);
                    }))
                .subscribe(
                    (rect: number[]): void => {
                        resolve(rect);
                    },
                    (error: Error): void => {
                        reject(error);
                    });
        });
    }

    /**
     * Force the creation of a geometry programatically using its
     * current vertices.
     *
     * @description The method only has an effect when the tag
     * mode is either of the following modes:
     *
     * TagMode.CreatePoints
     * TagMode.CreatePolygon
     * TagMode.CreateRect
     * TagMode.CreateRectDrag
     *
     * In the case of points or polygon creation, only the created
     * vertices are used, i.e. the mouse position is disregarded.
     *
     * In the case of rectangle creation the position of the mouse
     * at the time of the method call is used as one of the vertices
     * defining the rectangle.
     *
     * @fires TagComponent.geometrycreated
     *
     * @example
     * ```
     * tagComponent.on("geometrycreated", function(geometry) {
     *     console.log(geometry);
     * });
     *
     * tagComponent.create();
     * ```
     */
    public create(): void {
        this._tagCreator.replayedTag$.pipe(
            first(),
            filter(
                (tag: CreateTag<Geometry>): boolean => {
                    return !!tag;
                }))
            .subscribe(
                (tag: CreateTag<Geometry>): void => {
                    tag.create();
                });
    }

    /**
     * Change the current tag mode.
     *
     * @description Change the tag mode to one of the create modes for creating new geometries.
     *
     * @param {TagMode} mode - New tag mode.
     *
     * @fires TagComponent#modechanged
     *
     * @example ```tagComponent.changeMode(Mapillary.TagComponent.TagMode.CreateRect);```
     */
    public changeMode(mode: TagMode): void {
        this.configure({ mode: mode });
    }

    /**
     * Returns the tag in the tag set with the specified id, or
     * undefined if the id matches no tag.
     *
     * @param {string} tagId - Id of the tag.
     *
     * @example ```var tag = tagComponent.get("tagId");```
     */
    public get(tagId: string): Tag {
        if (this._activated) {
            const renderTag: RenderTag<Tag> = this._tagSet.get(tagId);
            return renderTag !== undefined ? renderTag.tag : undefined;
        } else {
            return this._tagSet.getDeactivated(tagId);
        }
    }

    /**
     * Returns an array of all tags.
     *
     * @example ```var tags = tagComponent.getAll();```
     */
    public getAll(): Tag[] {
        if (this.activated) {
            return this._tagSet
                .getAll()
                .map(
                    (renderTag: RenderTag<Tag>): Tag => {
                        return renderTag.tag;
                    });
        } else {
            return this._tagSet.getAllDeactivated();
        }
    }

    /**
     * Returns an array of tag ids for tags that contain the specified point.
     *
     * @description The pixel point must lie inside the polygon or rectangle
     * of an added tag for the tag id to be returned. Tag ids for
     * tags that do not have a fill will also be returned if the point is inside
     * the geometry of the tag. Tags with point geometries can not be retrieved.
     *
     * No tag ids will be returned for polygons rendered in cropped panoramas or
     * rectangles rendered in panoramas.
     *
     * Notice that the pixelPoint argument requires x, y coordinates from pixel space.
     *
     * With this function, you can use the coordinates provided by mouse
     * events to get information out of the tag component.
     *
     * If no tag at exist the pixel point, an empty array will be returned.
     *
     * @param {Array<number>} pixelPoint - Pixel coordinates on the viewer element.
     * @returns {Promise<Array<string>>} Promise to the ids of the tags that
     * contain the specified pixel point.
     *
     * @example
     * ```
     * tagComponent.getTagIdsAt([100, 100])
     *     .then((tagIds) => { console.log(tagIds); });
     * ```
     */
    public getTagIdsAt(pixelPoint: number[]): when.Promise<string[]> {
        return when.promise<string[]>((resolve: (value: string[]) => void, reject: (reason: Error) => void): void => {
            this._container.renderService.renderCamera$.pipe(
                first(),
                map(
                    (render: RenderCamera): string[] => {
                        const viewport: number[] = this._viewportCoords
                            .canvasToViewport(
                                pixelPoint[0],
                                pixelPoint[1],
                                this._container.container);

                        const ids: string[] = this._tagScene.intersectObjects(viewport, render.perspective);

                        return ids;
                    }))
                .subscribe(
                    (ids: string[]): void => {
                        resolve(ids);
                    },
                    (error: Error): void => {
                        reject(error);
                    });
        });
    }

    /**
     * Check if a tag exist in the tag set.
     *
     * @param {string} tagId - Id of the tag.
     *
     * @example ```var tagExists = tagComponent.has("tagId");```
     */
    public has(tagId: string): boolean {
        return this._activated ? this._tagSet.has(tagId) : this._tagSet.hasDeactivated(tagId);
    }

    /**
     * Remove tags with the specified ids from the tag set.
     *
     * @param {Array<string>} tagIds - Ids for tags to remove.
     *
     * @example ```tagComponent.remove(["id-1", "id-2"]);```
     */
    public remove(tagIds: string[]): void {
        if (this._activated) {
            this._tagSet.remove(tagIds);
            this._tagScene.remove(tagIds);
        } else {
            this._tagSet.removeDeactivated(tagIds);
        }
    }

    /**
     * Remove all tags from the tag set.
     *
     * @example ```tagComponent.removeAll();```
     */
    public removeAll(): void {
        if (this._activated) {
            this._tagSet.removeAll();
            this._tagScene.removeAll();
        } else {
            this._tagSet.removeAllDeactivated();
        }
    }

    protected _activate(): void {
        this._editVertexHandler.enable();

        const handlerGeometryCreated$: Observable<Geometry> =
            observableFrom(<(keyof typeof TagMode)[]>Object.keys(this._createHandlers)).pipe(
                map(
                    (key: keyof typeof TagMode): CreateHandlerBase => {
                        return this._createHandlers[key];
                    }),
                filter(
                    (handler: CreateHandlerBase): boolean => {
                        return !!handler;
                    }),
                mergeMap(
                    (handler: CreateHandlerBase): Observable<Geometry> => {
                        return handler.geometryCreated$;
                    }),
                share());

        this._fireGeometryCreatedSubscription = handlerGeometryCreated$
            .subscribe(
                (geometry: Geometry): void => {
                    this.fire(TagComponent.geometrycreated, geometry);
                });

        this._fireCreateGeometryEventSubscription = this._tagCreator.tag$.pipe(
            skipWhile(
                (tag: CreateTag<Geometry>): boolean => {
                    return tag == null;
                }),
            distinctUntilChanged())
            .subscribe(
                (tag: CreateTag<Geometry>): void => {
                    const eventType: string = tag != null ?
                        TagComponent.creategeometrystart :
                        TagComponent.creategeometryend;

                    this.fire(eventType, this);
                });

        this._handlerStopCreateSubscription = handlerGeometryCreated$
            .subscribe(
                (): void => {
                    this.changeMode(TagMode.Default);
                });

        this._handlerEnablerSubscription = this._creatingConfiguration$
            .subscribe(
                (configuration: ITagConfiguration): void => {
                    this._disableCreateHandlers();

                    const mode: keyof typeof TagMode = <keyof typeof TagMode>TagMode[configuration.mode];
                    const handler: CreateHandlerBase = this._createHandlers[mode];
                    if (!!handler) {
                        handler.enable();
                    }
                });

        this._fireTagsChangedSubscription = this._renderTags$
            .subscribe(
                (): void => {
                    this.fire(TagComponent.tagschanged, this);
                });

        this._stopCreateSubscription = this._tagCreator.tag$.pipe(
            switchMap(
                (tag: CreateTag<Geometry>): Observable<void> => {
                    return tag != null ?
                        tag.aborted$.pipe(
                            map((): void => { return null; })) :
                        observableEmpty();
                }))
            .subscribe((): void => { this.changeMode(TagMode.Default); });

        this._setGLCreateTagSubscription = this._tagCreator.tag$
            .subscribe(
                (tag: CreateTag<Geometry>): void => {
                    if (this._tagScene.hasCreateTag()) {
                        this._tagScene.removeCreateTag();
                    }

                    if (tag != null) {
                        this._tagScene.addCreateTag(tag);
                    }
                });

        this._createGLObjectsChangedSubscription = this._createGLObjectsChanged$
            .subscribe(
                (tag: CreateTag<Geometry>): void => {
                    this._tagScene.updateCreateTagObjects(tag);
                });

        this._updateGLObjectsSubscription = this._renderTagGLChanged$
            .subscribe(
                (tag: RenderTag<Tag>): void => {
                    this._tagScene.updateObjects(tag);
                });

        this._updateTagSceneSubscription = this._tagChanged$
            .subscribe(
                (): void => {
                    this._tagScene.update();
                });

        this._domSubscription = observableCombineLatest(
            this._renderTags$.pipe(
                startWith([]),
                tap(
                    (): void => {
                        this._container.domRenderer.render$.next({
                            name: this._name,
                            vnode: this._tagDomRenderer.clear(),
                        });
                    })),
            this._container.renderService.renderCamera$,
            this._container.spriteService.spriteAtlas$,
            this._container.renderService.size$,
            this._tagChanged$.pipe(startWith(null)),
            observableMerge(
                this._tagCreator.tag$,
                this._createGeometryChanged$).pipe(startWith(null))).pipe(
                    map(
                        ([renderTags, rc, atlas, size, , ct]:
                            [RenderTag<Tag>[], RenderCamera, ISpriteAtlas, ISize, Tag, CreateTag<Geometry>]):
                            IVNodeHash => {
                            return {
                                name: this._name,
                                vnode: this._tagDomRenderer.render(renderTags, ct, atlas, rc.perspective, size),
                            };
                        }))
            .subscribe(this._container.domRenderer.render$);

        this._glSubscription = this._navigator.stateService.currentState$.pipe(
            map(
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
                }))
            .subscribe(this._container.glRenderer.render$);

        this._navigator.stateService.currentTransform$.pipe(
            first())
            .subscribe(
                (transform: Transform): void => {
                    this._tagSet.activate(transform);
                    this._tagScene.add(this._tagSet.getAll());
                });

    }

    protected _deactivate(): void {
        this._editVertexHandler.disable();
        this._disableCreateHandlers();

        this._tagScene.clear();
        this._tagSet.deactivate();

        this._tagCreator.delete$.next(null);

        this._updateGLObjectsSubscription.unsubscribe();
        this._updateTagSceneSubscription.unsubscribe();

        this._stopCreateSubscription.unsubscribe();
        this._setGLCreateTagSubscription.unsubscribe();
        this._createGLObjectsChangedSubscription.unsubscribe();

        this._domSubscription.unsubscribe();
        this._glSubscription.unsubscribe();

        this._fireCreateGeometryEventSubscription.unsubscribe();
        this._fireGeometryCreatedSubscription.unsubscribe();
        this._fireTagsChangedSubscription.unsubscribe();

        this._handlerStopCreateSubscription.unsubscribe();
        this._handlerEnablerSubscription.unsubscribe();

        this._container.container.classList.remove("component-tag-create");
    }

    protected _getDefaultConfiguration(): ITagConfiguration {
        return {
            createColor: 0xFFFFFF,
            indicatePointsCompleter: true,
            mode: TagMode.Default,
        };
    }

    private _disableCreateHandlers(): void {
        const createHandlers: { [K in keyof typeof TagMode]: CreateHandlerBase } = this._createHandlers;
        for (const key in createHandlers) {
            if (!createHandlers.hasOwnProperty(key)) {
                continue;
            }

            const handler: CreateHandlerBase = createHandlers[<keyof typeof TagMode>key];
            if (!!handler) {
                handler.disable();
            }
        }
    }
}

ComponentService.register(TagComponent);
export default TagComponent;
