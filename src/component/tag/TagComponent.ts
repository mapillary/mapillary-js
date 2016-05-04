/// <reference path="../../../typings/browser.d.ts" />

import * as rx from "rx";
import * as THREE from "three";

import {Container, Navigator, ISpriteAtlas} from "../../Viewer";
import {APIv3} from "../../API";
import {
    ComponentService,
    Component,
    IActiveTag,
    TagBase,
    TagDOMRenderer,
    TagGLRenderer,
    TagOperation,
    TagSet,
} from "../../Component";
import {Transform} from "../../Geo";
import {RenderCamera, IVNodeHash, IGLRenderHash, GLRenderStage} from "../../Render";
import {IFrame} from "../../State";

interface ITagGLRendererOperation extends Function {
    (renderer: TagGLRenderer): TagGLRenderer;
}

export class TagComponent extends Component {
    public static componentName: string = "tag";

    public static tagchanged: string = "tagchanged";

    public static tagclick: string = "tagclick";

    private _apiV3: APIv3;

    private _tagDomRenderer: TagDOMRenderer;
    private _tagSet: TagSet;

    private _tagGlRendererOperation$: rx.Subject<ITagGLRendererOperation>;
    private _tagGlRenderer$: rx.Observable<TagGLRenderer>;

    private _currentTransform$: rx.Observable<Transform>;
    private _tags$: rx.Observable<TagBase[]>;
    private _tagChanged$: rx.Observable<TagBase>;
    private _tagInterationInitiated$: rx.Observable<string>;
    private _tagInteractionAbort$: rx.Observable<string>;
    private _tagLabelClick$: rx.Observable<TagBase>;
    private _activeTag$: rx.Observable<IActiveTag>;

    private _claimMouseSubscription: rx.IDisposable;
    private _mouseDragSubscription: rx.IDisposable;
    private _unclaimMouseSubscription: rx.IDisposable;
    private _setTagsSubscription: rx.IDisposable;
    private _updateTagSubscription: rx.IDisposable;
    private _tagChangedEventSubscription: rx.IDisposable;
    private _tagClickEventSubscription: rx.IDisposable;

    private _domSubscription: rx.IDisposable;
    private _glSubscription: rx.IDisposable;

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);

        this._tagDomRenderer = new TagDOMRenderer();
        this._tagSet = new TagSet();

        this._apiV3 = navigator.apiV3;

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
            .map<TagBase[]>(
                (tagData: { [id: string]: TagBase }): TagBase[] => {
                    let tags: TagBase[] = [];

                    // ensure that tags are always rendered in the same order
                    // to avoid hover tracking problems on first resize.
                    for (let key of Object.keys(tagData).sort()) {
                        tags.push(tagData[key]);
                    }

                    return tags;
                })
            .share();

        this._tagChanged$ = this._tags$
            .flatMapLatest<TagBase>(
                (tags: TagBase[]): rx.Observable<TagBase> => {
                    return rx.Observable
                        .fromArray(tags)
                        .flatMap<TagBase>(
                            (tag: TagBase): rx.Observable<TagBase> => {
                                return tag.onChanged$;
                            });
                })
            .share();

        this._tagInterationInitiated$ = this._tags$
            .flatMapLatest<string>(
                (tags: TagBase[]): rx.Observable<string> => {
                    return rx.Observable
                        .fromArray(tags)
                        .flatMap<string>(
                            (tag: TagBase): rx.Observable<string> => {
                                return tag.interactionInitiate$;
                            });
                })
            .share();

        this._tagInteractionAbort$ = this._tags$
            .flatMapLatest<string>(
                (tags: TagBase[]): rx.Observable<string> => {
                    return rx.Observable
                        .fromArray(tags)
                        .flatMap<string>(
                            (tag: TagBase): rx.Observable<string> => {
                                return tag.interactionAbort$;
                            });
                })
            .share();

        this._activeTag$ = this._tags$
            .flatMapLatest<IActiveTag>(
                (tags: TagBase[]): rx.Observable<IActiveTag> => {
                    return rx.Observable
                        .fromArray(tags)
                        .flatMap<IActiveTag>(
                            (tag: TagBase): rx.Observable<IActiveTag> => {
                                return tag.activeTag$;
                            });
                })
            .share();

        this._tagLabelClick$ = this._tags$
            .flatMapLatest<TagBase>(
                (tags: TagBase[]): rx.Observable<TagBase> => {
                    return rx.Observable
                        .fromArray(tags)
                        .flatMap<TagBase>(
                            (tag: TagBase): rx.Observable<TagBase> => {
                                return tag.labelClick$;
                            });
                })
            .share();
    }

    public setTags(tags: TagBase[]): void {
        this._tagSet.set$.onNext(tags);
    }

    protected _activate(): void {
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
                    activeTag: IActiveTag,
                    renderCamera: RenderCamera,
                    transform: Transform):
                    [MouseEvent, IActiveTag, RenderCamera, Transform] => {
                    return [event, activeTag, renderCamera, transform];
                })
            .subscribe(
                (args: [MouseEvent, IActiveTag, RenderCamera, Transform]): void => {
                    let mouseEvent: MouseEvent = args[0];
                    let activeTag: IActiveTag = args[1];
                    let renderCamera: RenderCamera = args[2];
                    let transform: Transform = args[3];

                    if (activeTag.operation === TagOperation.None) {
                        return;
                    }

                    let element: HTMLElement = this._container.element;

                    let clientRect: ClientRect = element.getBoundingClientRect();

                    let canvasX: number = mouseEvent.clientX - clientRect.left - activeTag.offsetX;
                    let canvasY: number = mouseEvent.clientY - clientRect.top - activeTag.offsetY;

                    let projectedX: number = 2 * canvasX / element.offsetWidth - 1;
                    let projectedY: number = 1 - 2 * canvasY / element.offsetHeight;

                    let unprojected: THREE.Vector3 =
                        new THREE.Vector3(projectedX, projectedY, 1).unproject(renderCamera.perspective);

                    let newCoord: number[] = transform.projectBasic(unprojected.toArray());

                    if (activeTag.operation === TagOperation.Move) {
                        activeTag.tag.setCentroid2d(newCoord);
                    } else if (activeTag.operation === TagOperation.Resize) {
                        activeTag.tag.setPolygonPoint2d(activeTag.resizeIndex, newCoord);
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
                (tags: TagBase[], transform: Transform): [TagBase[], Transform] => {
                    return [tags, transform];
                })
            .map<ITagGLRendererOperation>(
                (tt: [TagBase[], Transform]): ITagGLRendererOperation => {
                    return (renderer: TagGLRenderer): TagGLRenderer => {
                        renderer.setTags(tt[0], tt[1]);

                        return renderer;
                    };
                })
            .subscribe(this._tagGlRendererOperation$);

        this._updateTagSubscription = this._tagChanged$
            .withLatestFrom(
                this._currentTransform$,
                (tag: TagBase, transform: Transform): [TagBase, Transform] => {
                    return [tag, transform];
                })
            .map<ITagGLRendererOperation>(
                (tt: [TagBase, Transform]): ITagGLRendererOperation => {
                    return (renderer: TagGLRenderer): TagGLRenderer => {
                        renderer.updateTag(tt[0], tt[1]);

                        return renderer;
                    };
                })
            .subscribe(this._tagGlRendererOperation$);

        this._tagChangedEventSubscription = this._tagChanged$
            .subscribe(
                (tag: TagBase): void => {
                    this.fire(TagComponent.tagchanged, tag);
                });

        this._tagClickEventSubscription = this._tagLabelClick$
            .subscribe(
                (tag: TagBase): void => {
                    this.fire(TagComponent.tagclick, tag);
                });

        this._domSubscription = rx.Observable
            .combineLatest(
                this._container.renderService.renderCamera$,
                this._container.spriteService.spriteAtlas$,
                this._tags$,
                this._tagChanged$.startWith(null),
                (rc: RenderCamera, atlas: ISpriteAtlas, tags: TagBase[], tag: TagBase):
                [RenderCamera, ISpriteAtlas, TagBase[], TagBase] => {
                    return [rc, atlas, tags, tag];
                })
            .withLatestFrom(
                this._currentTransform$,
                (rcts: [RenderCamera, ISpriteAtlas, TagBase[], TagBase], transform: Transform):
                    [RenderCamera, ISpriteAtlas, TagBase[], TagBase, Transform] => {
                    return [rcts[0], rcts[1], rcts[2], rcts[3], transform];
                })
            .map<IVNodeHash>(
                (rcts: [RenderCamera, ISpriteAtlas, TagBase[], TagBase, Transform]): IVNodeHash => {
                    return {
                        name: this._name,
                        vnode: this._tagDomRenderer.render(rcts[2], rcts[1], rcts[0].perspective, rcts[4]),
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
        this._tagChangedEventSubscription.dispose();

        this._domSubscription.dispose();
        this._glSubscription.dispose();
    }
}

ComponentService.register(TagComponent);
export default TagComponent;
