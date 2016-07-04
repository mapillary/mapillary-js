/// <reference path="../../../typings/index.d.ts" />

import * as rx from "rx";
import * as THREE from "three";

import {
    ComponentService,
    Component,
    Geometry,
    GeometryType,
    IInteraction,
    ITagConfiguration,
    PointGeometry,
    OutlineCreateTag,
    PolygonGeometry,
    RectGeometry,
    Tag,
    TagCreator,
    TagDOMRenderer,
    TagGLRenderer,
    TagOperation,
    TagSet,
    VertexGeometry,
} from "../../Component";
import {Transform} from "../../Geo";
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
export class TagComponent extends Component {
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

    private _tagGlRendererOperation$: rx.Subject<ITagGLRendererOperation>;
    private _tagGlRenderer$: rx.Observable<TagGLRenderer>;

    private _tags$: rx.Observable<Tag[]>;
    private _tagChanged$: rx.Observable<Tag>;
    private _tagInterationInitiated$: rx.Observable<string>;
    private _tagInteractionAbort$: rx.Observable<string>;
    private _activeTag$: rx.Observable<IInteraction>;

    private _basicClick$: rx.Observable<number[]>;
    private _validBasicClick$: rx.Observable<number[]>;

    private _createGeometryChanged$: rx.Observable<OutlineCreateTag>;
    private _tagCreated$: rx.Observable<OutlineCreateTag>;
    private _vertexGeometryCreated$: rx.Observable<Geometry>;
    private _pointGeometryCreated$: rx.Subject<Geometry>;
    private _geometryCreated$: rx.Observable<Geometry>;

    private _creating$: rx.Observable<boolean>;
    private _creatingConfiguration$: rx.Observable<ITagConfiguration>;

    private _claimMouseSubscription: rx.IDisposable;
    private _mouseDragSubscription: rx.IDisposable;
    private _unclaimMouseSubscription: rx.IDisposable;
    private _setTagsSubscription: rx.IDisposable;
    private _updateTagSubscription: rx.IDisposable;

    private _stopCreateSubscription: rx.IDisposable;
    private _creatorConfigurationSubscription: rx.IDisposable;
    private _createSubscription: rx.IDisposable;
    private _createPointSubscription: rx.IDisposable;
    private _setCreateVertexSubscription: rx.IDisposable;
    private _addPointSubscription: rx.IDisposable;
    private _deleteCreatedSubscription: rx.IDisposable;
    private _setGLCreateTagSubscription: rx.IDisposable;

    private _domSubscription: rx.IDisposable;
    private _glSubscription: rx.IDisposable;

    private _geometryCreatedEventSubscription: rx.IDisposable;
    private _tagsChangedEventSubscription: rx.IDisposable;

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);

        this._tagDomRenderer = new TagDOMRenderer();
        this._tagSet = new TagSet();
        this._tagCreator = new TagCreator();

        this._tagGlRendererOperation$ = new rx.Subject<ITagGLRendererOperation>();

        this._tagGlRenderer$ = this._tagGlRendererOperation$
            .startWith(
                (renderer: TagGLRenderer): TagGLRenderer => {
                    return renderer;
                })
            .scan<TagGLRenderer>(
                (renderer: TagGLRenderer, operation: ITagGLRendererOperation): TagGLRenderer => {
                    return operation(renderer);
                },
                new TagGLRenderer());

        this._tags$ = this._tagSet.tagData$
            .map<Tag[]>(
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

        this._tagChanged$ = this._tags$
            .flatMapLatest<Tag>(
                (tags: Tag[]): rx.Observable<Tag> => {
                    return rx.Observable
                        .fromArray(tags)
                        .flatMap<Tag>(
                            (tag: Tag): rx.Observable<Tag> => {
                                return rx.Observable.merge(
                                    tag.changed$,
                                    tag.geometryChanged$);
                            });
                })
            .share();

        this._tagInterationInitiated$ = this._tags$
            .flatMapLatest<string>(
                (tags: Tag[]): rx.Observable<string> => {
                    return rx.Observable
                        .fromArray(tags)
                        .flatMap<string>(
                            (tag: Tag): rx.Observable<string> => {
                                return tag.interact$
                                    .map<string>(
                                        (interaction: IInteraction): string => {
                                            return interaction.tag.id;
                                        });
                            });
                })
            .share();

        this._tagInteractionAbort$ = this._tags$
            .flatMapLatest<string>(
                (tags: Tag[]): rx.Observable<string> => {
                    return rx.Observable
                        .fromArray(tags)
                        .flatMap<string>(
                            (tag: Tag): rx.Observable<string> => {
                                return tag.abort$;
                            });
                })
            .share();

        this._activeTag$ = this._tags$
            .flatMapLatest<IInteraction>(
                (tags: Tag[]): rx.Observable<IInteraction> => {
                    return rx.Observable
                        .fromArray(tags)
                        .flatMap<IInteraction>(
                            (tag: Tag): rx.Observable<IInteraction> => {
                                return tag.interact$;
                            });
                })
            .share();

        this._createGeometryChanged$ = this._tagCreator.tag$
            .flatMapLatest<OutlineCreateTag>(
                (tag: OutlineCreateTag): rx.Observable<OutlineCreateTag> => {
                    return tag != null ?
                        tag.geometryChanged$ :
                        rx.Observable.empty<OutlineCreateTag>();
                })
            .share();

        this._tagCreated$ = this._tagCreator.tag$
            .flatMapLatest<OutlineCreateTag>(
                (tag: OutlineCreateTag): rx.Observable<OutlineCreateTag> => {
                    return tag != null ?
                        tag.created$ :
                        rx.Observable.empty<OutlineCreateTag>();
                })
            .share();

        this._vertexGeometryCreated$ = this._tagCreated$
            .map<Geometry>(
                (tag: OutlineCreateTag): Geometry => {
                    return tag.geometry;
                })
            .share();

        this._pointGeometryCreated$ = new rx.Subject<Geometry>();

        this._geometryCreated$ = rx.Observable
            .merge(
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
            .map<number[]>(
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
                (configuration: ITagConfiguration): boolean => {
                    return configuration.creating;
                })
            .share();

        this._creating$ = this._creatingConfiguration$
            .map<boolean>(
                (configuration: ITagConfiguration): boolean => {
                    return configuration.creating;
                })
            .share();

        this._creating$
            .subscribe(
                (creating: boolean): void => {
                    this.fire(TagComponent.creatingchanged, creating);
                });

        this._tagInteractionAbort$.subscribe();
    }

   /**
    * Get default configuration.
    *
    * @returns {ITagConfiguration}
    */
    public get defaultConfiguration(): ITagConfiguration {
        return {
            createColor: 0xFFFFFF,
            creating: false,
        };
    }

    /**
     * Get tags observable.
     *
     * @description An observable emitting every time the items in the
     * tag array changes.
     *
     * @returns {Observable<Tag[]>}
     */
    public get tags$(): rx.Observable<Tag[]> {
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
    public get geometryCreated$(): rx.Observable<Geometry> {
        return this._geometryCreated$;
    }

    /**
     * Set the tags to display.
     *
     * @param {Tag[]} tags - The tags.
     */
    public setTags(tags: Tag[]): void {
        this._tagSet.set$.onNext(tags);
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
        this.configure({ createType: null, creating: false });
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

        let nodeChanged$: rx.Observable<void> = this.configuration$
            .flatMapLatest<void>(
                (configuration: ITagConfiguration): rx.Observable<void> => {
                    return configuration.creating ?
                        this._navigator.stateService.currentNode$
                            .skip(1)
                            .take(1)
                            .map<void>((n: Node): void => { return null; }) :
                        rx.Observable.empty<void>();
                });

        let tagAborted$: rx.Observable<void> = this._tagCreator.tag$
            .flatMapLatest<void>(
                (tag: OutlineCreateTag): rx.Observable<void> => {
                    return tag != null ?
                        tag.aborted$
                            .map<void>((t: OutlineCreateTag): void => { return null; }) :
                        rx.Observable.empty<void>();
                });

        let tagCreated$: rx.Observable<void> = this._tagCreated$
            .map<void>((t: OutlineCreateTag): void => { return null; });

        let pointGeometryCreated$: rx.Observable<void> = this._pointGeometryCreated$
            .map<void>((p: PointGeometry): void => { return null; });

        this._stopCreateSubscription = rx.Observable
            .merge(
                nodeChanged$,
                tagAborted$,
                tagCreated$,
                pointGeometryCreated$)
            .subscribe((): void => { this.stopCreate(); });

        this._creatorConfigurationSubscription = this._configuration$
            .subscribe(this._tagCreator.configuration$);

        this._createSubscription = this._creatingConfiguration$
            .flatMapLatest<number[]>(
                (configuration: ITagConfiguration): rx.Observable<number[]> => {
                    return configuration.creating &&
                        configuration.createType === "rect" ||
                        configuration.createType === "polygon" ?
                        this._validBasicClick$.take(1) :
                        rx.Observable.empty<number[]>();
                })
            .subscribe(this._tagCreator.create$);

        this._createPointSubscription = this._creatingConfiguration$
            .flatMapLatest<number[]>(
                (configuration: ITagConfiguration): rx.Observable<number[]> => {
                    return configuration.creating &&
                        configuration.createType === "point" ?
                        this._validBasicClick$.take(1) :
                        rx.Observable.empty<number[]>();
                })
            .map<Geometry>(
                (basic: number[]): Geometry => {
                    return new PointGeometry(basic);
                })
            .subscribe(this._pointGeometryCreated$);

        this._setCreateVertexSubscription = rx.Observable
            .combineLatest(
                this._container.mouseService.mouseMove$,
                this._tagCreator.tag$,
                this._container.renderService.renderCamera$,
                (
                    event: MouseEvent,
                    tag: OutlineCreateTag,
                    renderCamera: RenderCamera):
                    [MouseEvent, OutlineCreateTag, RenderCamera] => {
                    return [event, tag, renderCamera];
                })
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

        this._addPointSubscription = this._creating$
            .flatMapLatest<number[]>(
                (creating: boolean): rx.Observable<number[]> => {
                    return creating ?
                        this._basicClick$.skipUntil(this._validBasicClick$) :
                        rx.Observable.empty<number[]>();
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

        this._deleteCreatedSubscription = this._creating$
            .filter((creating: boolean): boolean => { return !creating; })
            .subscribe(
                (creating: boolean): void => {
                    this._tagCreator.delete$.onNext(null);
                });

        this._setGLCreateTagSubscription = rx.Observable
            .merge(
                this._tagCreator.tag$,
                this._createGeometryChanged$)
            .withLatestFrom(
                this._navigator.stateService.currentTransform$,
                (tag: OutlineCreateTag, transform: Transform): [OutlineCreateTag, Transform] => {
                    return [tag, transform];
                })
            .map<ITagGLRendererOperation>(
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
            .flatMapLatest(
                (id: string): rx.Observable<MouseEvent> => {
                    return this._container.mouseService.mouseMove$
                        .takeUntil(this._tagInteractionAbort$)
                        .take(1);
                })
            .subscribe(
                (e: MouseEvent): void => {
                    this._container.mouseService.claimMouse(this._name, 1);
                });

        this._mouseDragSubscription = rx.Observable
            .combineLatest(
                this._container.mouseService.filtered$(this._name, this._container.mouseService.mouseDrag$),
                this._container.renderService.renderCamera$,
                (e: MouseEvent, c: RenderCamera): [MouseEvent, RenderCamera] => {
                    return [e, c];
                })
            .withLatestFrom(
                this._activeTag$,
                this._navigator.stateService.currentTransform$,
                (
                    ec: [MouseEvent, RenderCamera],
                    activeTag: IInteraction,
                    transform: Transform):
                    [MouseEvent, RenderCamera, IInteraction, Transform] => {
                    return [ec[0], ec[1], activeTag, transform];
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
            .filtered$(this._name, this._container.mouseService.mouseDragEnd$)
            .subscribe((e: MouseEvent): void => {
                this._container.mouseService.unclaimMouse(this._name);
             });

        this._setTagsSubscription = this._tags$
            .withLatestFrom(
                this._navigator.stateService.currentTransform$,
                (tags: Tag[], transform: Transform): [Tag[], Transform] => {
                    return [tags, transform];
                })
            .map<ITagGLRendererOperation>(
                (tt: [Tag[], Transform]): ITagGLRendererOperation => {
                    return (renderer: TagGLRenderer): TagGLRenderer => {
                        renderer.setTags(tt[0], tt[1]);

                        return renderer;
                    };
                })
            .subscribe(this._tagGlRendererOperation$);

        this._updateTagSubscription = this._tagChanged$
            .withLatestFrom(
                this._navigator.stateService.currentTransform$,
                (tag: Tag, transform: Transform): [Tag, Transform] => {
                    return [tag, transform];
                })
            .map<ITagGLRendererOperation>(
                (tt: [Tag, Transform]): ITagGLRendererOperation => {
                    return (renderer: TagGLRenderer): TagGLRenderer => {
                        renderer.updateTag(tt[0], tt[1]);

                        return renderer;
                    };
                })
            .subscribe(this._tagGlRendererOperation$);

        this._domSubscription = rx.Observable
            .combineLatest(
                this._container.renderService.renderCamera$,
                this._container.spriteService.spriteAtlas$,
                this._tags$.startWith([]),
                this._tagChanged$.startWith(null),
                this._tagCreator.tag$.merge(this._createGeometryChanged$).startWith(null),
                this._configuration$,
                (rc: RenderCamera, atlas: ISpriteAtlas, tags: Tag[], tag: Tag, ct: OutlineCreateTag, c: ITagConfiguration):
                [RenderCamera, ISpriteAtlas, Tag[], Tag, OutlineCreateTag, ITagConfiguration] => {
                    return [rc, atlas, tags, tag, ct, c];
                })
            .withLatestFrom(
                this._navigator.stateService.currentTransform$,
                (args: [RenderCamera, ISpriteAtlas, Tag[], Tag, OutlineCreateTag, ITagConfiguration], transform: Transform):
                    [RenderCamera, ISpriteAtlas, Tag[], Tag, OutlineCreateTag, ITagConfiguration, Transform] => {
                    return [args[0], args[1], args[2], args[3], args[4], args[5], transform];
                })
            .map<IVNodeHash>(
                (args: [RenderCamera, ISpriteAtlas, Tag[], Tag, OutlineCreateTag, ITagConfiguration, Transform]):
                    IVNodeHash => {
                    return {
                        name: this._name,
                        vnode: this._tagDomRenderer.render(args[2], args[4], args[1], args[0].perspective, args[6], args[5]),
                    };
                })
            .subscribe(this._container.domRenderer.render$);

        this._glSubscription = this._navigator.stateService.currentState$
            .withLatestFrom(
                this._tagGlRenderer$,
                (frame: IFrame, renderer: TagGLRenderer): [IFrame, TagGLRenderer] => {
                    return [frame, renderer];
                })
            .map<IGLRenderHash>(
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
            .onNext(
                (renderer: TagGLRenderer): TagGLRenderer => {
                    renderer.dispose();

                    return renderer;
                });

        this._tagSet.set$.onNext([]);
        this._tagCreator.delete$.onNext(null);

        this._claimMouseSubscription.dispose();
        this._mouseDragSubscription.dispose();
        this._unclaimMouseSubscription.dispose();
        this._setTagsSubscription.dispose();
        this._updateTagSubscription.dispose();

        this._stopCreateSubscription.dispose();
        this._creatorConfigurationSubscription.dispose();
        this._createSubscription.dispose();
        this._createPointSubscription.dispose();
        this._setCreateVertexSubscription.dispose();
        this._addPointSubscription.dispose();
        this._deleteCreatedSubscription.dispose();
        this._setGLCreateTagSubscription.dispose();

        this._domSubscription.dispose();
        this._glSubscription.dispose();

        this._geometryCreatedEventSubscription.dispose();
        this._tagsChangedEventSubscription.dispose();
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

        let clientRect: ClientRect = element.getBoundingClientRect();

        let canvasX: number = event.clientX - clientRect.left - offsetX;
        let canvasY: number = event.clientY - clientRect.top - offsetY;

        let projectedX: number = 2 * canvasX / element.offsetWidth - 1;
        let projectedY: number = 1 - 2 * canvasY / element.offsetHeight;

        let unprojected: THREE.Vector3 =
            new THREE.Vector3(projectedX, projectedY, 1).unproject(camera.perspective);

        let basic: number[] = transform.projectBasic(unprojected.toArray());

        return basic;
    }
}

ComponentService.register(TagComponent);
export default TagComponent;
