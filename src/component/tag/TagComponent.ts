/// <reference path="../../../typings/browser.d.ts" />

import * as rx from "rx";
import * as THREE from "three";

import {
    ComponentService,
    Component,
    Geometry,
    GeometryType,
    IInteraction,
    ITagConfiguration,
    OutlineCreateTag,
    Tag,
    TagCreator,
    TagDOMRenderer,
    TagGLRenderer,
    TagOperation,
    TagSet,
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

export class TagComponent extends Component {
    public static componentName: string = "tag";

    public static creatingchanged: string = "creatingchanged";

    public static geometrycreated: string = "geometrycreated";

    public static tagschanged: string = "tagschanged";

    private _tagDomRenderer: TagDOMRenderer;
    private _tagSet: TagSet;
    private _tagCreator: TagCreator;

    private _tagGlRendererOperation$: rx.Subject<ITagGLRendererOperation>;
    private _tagGlRenderer$: rx.Observable<TagGLRenderer>;

    private _currentTransform$: rx.Observable<Transform>;
    private _tags$: rx.Observable<Tag[]>;
    private _tagChanged$: rx.Observable<Tag>;
    private _tagInterationInitiated$: rx.Observable<string>;
    private _tagInteractionAbort$: rx.Observable<string>;
    private _activeTag$: rx.Observable<IInteraction>;

    private _basicClick$: rx.Observable<number[]>;
    private _validBasicClick$: rx.Observable<number[]>;

    private _createGeometryChanged$: rx.Observable<OutlineCreateTag>;
    private _tagCreated$: rx.Observable<OutlineCreateTag>;
    private _geometryCreated$: rx.Observable<Geometry>;

    private _creating$: rx.Observable<boolean>;

    private _claimMouseSubscription: rx.IDisposable;
    private _mouseDragSubscription: rx.IDisposable;
    private _unclaimMouseSubscription: rx.IDisposable;
    private _setTagsSubscription: rx.IDisposable;
    private _updateTagSubscription: rx.IDisposable;

    private _stopCreateSubscription: rx.IDisposable;
    private _geometryTypeSubscription: rx.IDisposable;
    private _createSubscription: rx.IDisposable;
    private _setCreatePolygonPointSubscription: rx.IDisposable;
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

        this._currentTransform$ = this._navigator.stateService.currentState$
            .distinctUntilChanged(
                (frame: IFrame): string => {
                    return frame.state.currentNode.key;
                })
            .map<Transform>(
                (frame: IFrame): Transform => {
                    return frame.state.currentTransform;
                })
            .shareReplay(1);

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

        this._geometryCreated$ = this._tagCreated$
            .map<Geometry>(
                (tag: OutlineCreateTag): Geometry => {
                    return tag.geometry;
                })
            .share();

        this._basicClick$ = this._container.mouseService.staticClick$
            .withLatestFrom(
                this._container.renderService.renderCamera$,
                this._currentTransform$,
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

        this._creating$ = this._configuration$
            .distinctUntilChanged(
                (configuration: ITagConfiguration): boolean => {
                    return configuration.creating;
                })
            .map<boolean>((configuration: ITagConfiguration): boolean => { return configuration.creating; })
            .share();

        this._creating$
            .subscribe(
                (creating: boolean): void => {
                    this.fire(TagComponent.creatingchanged, creating);
                });
    }

    public get tags$(): rx.Observable<Tag[]> {
        return this._tags$;
    }

    public get geometryCreated$(): rx.Observable<Geometry> {
        return this._geometryCreated$;
    }

    public setTags(tags: Tag[]): void {
        this._tagSet.set$.onNext(tags);
    }

    public startCreate(geometryType: GeometryType): void {
        this.configure({ createType: null, creating: false });
        this.configure({ createType: geometryType, creating: true });
    }

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

        this._stopCreateSubscription = rx.Observable
            .merge(
                nodeChanged$,
                tagAborted$,
                tagCreated$)
            .subscribe((): void => { this.stopCreate(); });

        this._geometryTypeSubscription = this._configuration$
            .map<GeometryType>(
                (configuration: ITagConfiguration): GeometryType => {
                    return configuration.createType;
                })
            .subscribe(this._tagCreator.geometryType$);

        this._createSubscription = this._creating$
            .flatMapLatest<number[]>(
                (creating: boolean): rx.Observable<number[]> => {
                    return creating ?
                        this._validBasicClick$.take(1) :
                        rx.Observable.empty<number[]>();
                })
            .subscribe(this._tagCreator.create$);

        this._setCreatePolygonPointSubscription = rx.Observable
            .combineLatest(
                this._container.mouseService.mouseMove$,
                this._tagCreator.tag$,
                (event: MouseEvent, tag: OutlineCreateTag): [MouseEvent, OutlineCreateTag] => {
                    return [event, tag];
                })
            .filter(
                (et: [MouseEvent, OutlineCreateTag]): boolean => {
                    return et[1] != null;
                })
            .withLatestFrom(
                this._container.renderService.renderCamera$,
                this._currentTransform$,
                (
                    et: [MouseEvent, OutlineCreateTag],
                    renderCamera: RenderCamera,
                    transform: Transform):
                    [MouseEvent, OutlineCreateTag, RenderCamera, Transform] => {
                    return [et[0], et[1], renderCamera, transform];
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

                    tag.geometry.setPolygonPoint2d(3, basic, transform);
                });

        this._addPointSubscription = this._creating$
            .flatMapLatest<number[]>(
                (creating: boolean): rx.Observable<number[]> => {
                    return creating ?
                        this._basicClick$.skipUntil(this._validBasicClick$).skip(1) :
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
                this._currentTransform$,
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
                    return this._container.mouseService.mouseDragStart$
                        .takeUntil(this._tagInteractionAbort$)
                        .take(1);
                })
            .subscribe(
                (e: MouseEvent): void => {
                    this._container.mouseService.claimMouse(this._name, 1);
                });

        this._mouseDragSubscription = this._container.mouseService
            .filtered$(this._name, this._container.mouseService.mouseDrag$)
            .withLatestFrom(
                this._activeTag$,
                this._container.renderService.renderCamera$,
                this._currentTransform$,
                (
                    event: MouseEvent,
                    activeTag: IInteraction,
                    renderCamera: RenderCamera,
                    transform: Transform):
                    [MouseEvent, IInteraction, RenderCamera, Transform] => {
                    return [event, activeTag, renderCamera, transform];
                })
            .subscribe(
                (args: [MouseEvent, IInteraction, RenderCamera, Transform]): void => {
                    let mouseEvent: MouseEvent = args[0];
                    let activeTag: IInteraction = args[1];
                    let renderCamera: RenderCamera = args[2];
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

                    if (activeTag.operation === TagOperation.Move) {
                        activeTag.tag.geometry.setCentroid2d(basic, transform);
                    } else if (activeTag.operation === TagOperation.Resize) {
                        activeTag.tag.geometry.setPolygonPoint2d(activeTag.pointIndex, basic, transform);
                    }
                });

        this._unclaimMouseSubscription = this._container.mouseService
            .filtered$(this._name, this._container.mouseService.mouseDragEnd$)
            .subscribe((e: MouseEvent): void => {
                this._container.mouseService.unclaimMouse(this._name);
             });

        this._setTagsSubscription = this._tags$
            .withLatestFrom(
                this._currentTransform$,
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
                this._currentTransform$,
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
                this._tags$,
                this._tagChanged$.startWith(null),
                this._tagCreator.tag$.startWith(null),
                (rc: RenderCamera, atlas: ISpriteAtlas, tags: Tag[], tag: Tag, createTag: OutlineCreateTag):
                [RenderCamera, ISpriteAtlas, Tag[], Tag, OutlineCreateTag] => {
                    return [rc, atlas, tags, tag, createTag];
                })
            .withLatestFrom(
                this._currentTransform$,
                (rcts: [RenderCamera, ISpriteAtlas, Tag[], Tag, OutlineCreateTag], transform: Transform):
                    [RenderCamera, ISpriteAtlas, Tag[], Tag, OutlineCreateTag, Transform] => {
                    return [rcts[0], rcts[1], rcts[2], rcts[3], rcts[4], transform];
                })
            .map<IVNodeHash>(
                (rcts: [RenderCamera, ISpriteAtlas, Tag[], Tag, OutlineCreateTag, Transform]): IVNodeHash => {
                    return {
                        name: this._name,
                        vnode: this._tagDomRenderer.render(rcts[2], rcts[4], rcts[1], rcts[0].perspective, rcts[5]),
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

        this._claimMouseSubscription.dispose();
        this._mouseDragSubscription.dispose();
        this._unclaimMouseSubscription.dispose();
        this._setTagsSubscription.dispose();
        this._updateTagSubscription.dispose();

        this._stopCreateSubscription.dispose();
        this._geometryTypeSubscription.dispose();
        this._createSubscription.dispose();
        this._setCreatePolygonPointSubscription.dispose();
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
