/// <reference path="../../../typings/browser.d.ts" />

import * as rx from "rx";
import * as THREE from "three";

import {Container, Navigator} from "../../Viewer";
import {APIv3} from "../../API";
import {
    ComponentService,
    Component,
    IActiveTag,
    ITag,
    Tag,
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

    private _apiV3: APIv3;

    private _tagDomRenderer: TagDOMRenderer;
    private _tagSet: TagSet;

    private _tagGlRendererOperation$: rx.Subject<ITagGLRendererOperation>;
    private _tagGlRenderer$: rx.Observable<TagGLRenderer>;

    private _currentTransform$: rx.Observable<Transform>;
    private _tags$: rx.Observable<Tag[]>;
    private _tagChanged$: rx.Observable<Tag>;

    private _claimMouseSubscription: rx.Disposable;
    private _mouseDragSubscription: rx.Disposable;
    private _unclaimMouseSubscription: rx.Disposable;
    private _tagsSubscription: rx.Disposable;
    private _tagChangedSubscription: rx.Disposable;

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
                    let tagsChanged$: rx.Observable<Tag>[] = tags
                        .map(
                            (tag: Tag): rx.Observable<Tag> => {
                                return tag.onChanged$;
                            });

                    return tagsChanged$.length === 0 ?
                        rx.Observable.empty<Tag>() :
                        rx.Observable.merge(tagsChanged$);
                })
            .share();
    }

    public setTags(tags: ITag[]): void {
        this._currentTransform$
            .first()
            .subscribe(
                (transform: Transform): void => {
                    let computedTags: Tag[] = tags
                        .map((tag: ITag): Tag => {
                            return new Tag(
                                tag.id,
                                transform,
                                tag.rect.slice(),
                                tag.value);
                        });

                    this._tagSet.set$.onNext(computedTags);
                });
    }

    protected _activate(): void {
        this._claimMouseSubscription = this._tagDomRenderer.editInitiated$
            .flatMapLatest(
                (): rx.Observable<MouseEvent> => {
                    return this._container.mouseService.mouseDragStart$
                        .takeUntil(this._tagDomRenderer.editAbort$)
                        .take(1);
                })
            .subscribe(
                (e: MouseEvent): void => {
                    this._container.mouseService.claimMouse(this._name, 1);
                });

        this._mouseDragSubscription = this._container.mouseService
            .filtered$(this._name, this._container.mouseService.mouseDrag$)
            .withLatestFrom(
                this._tagDomRenderer.activeTag$,
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

                    let element: HTMLElement = this._container.element;

                    let canvasX: number = mouseEvent.clientX - element.offsetLeft - activeTag.offsetX;
                    let canvasY: number = mouseEvent.clientY - element.offsetTop - activeTag.offsetY;

                    let projectedX: number = 2 * canvasX / element.offsetWidth - 1;
                    let projectedY: number = 1 - 2 * canvasY / element.offsetHeight;

                    let unprojected: THREE.Vector3 =
                        new THREE.Vector3(projectedX, projectedY, 1).unproject(renderCamera.perspective);

                    let newCoord: number[] = transform.projectBasic(unprojected.toArray());

                    activeTag.tag.shape =
                        this._computeRect(
                            activeTag.tag.shape,
                            newCoord,
                            activeTag.operation);
                });

        this._unclaimMouseSubscription = this._container.mouseService
            .filtered$(this._name, this._container.mouseService.mouseDragEnd$)
            .subscribe((e: MouseEvent): void => {
                this._container.mouseService.unclaimMouse(this._name);
             });

        this._tagsSubscription = this._tags$
            .map<ITagGLRendererOperation>(
                (tags: Tag[]): ITagGLRendererOperation => {
                    return (renderer: TagGLRenderer): TagGLRenderer => {
                        renderer.setTags(tags);

                        return renderer;
                    };
                })
            .subscribe(this._tagGlRendererOperation$);

        this._tagChangedSubscription = this._tagChanged$
            .map<ITagGLRendererOperation>(
                (tag: Tag): ITagGLRendererOperation => {
                    return (renderer: TagGLRenderer): TagGLRenderer => {
                        renderer.updateTag(tag);

                        return renderer;
                    };
                })
            .subscribe(this._tagGlRendererOperation$);

        this._domSubscription = rx.Observable
            .combineLatest(
                this._container.renderService.renderCamera$,
                this._tags$,
                this._tagChanged$.startWith(null),
                (rc: RenderCamera, tags: Tag[], tag: Tag): [RenderCamera, Tag[], Tag] => {
                    return [rc, tags, tag];
                })
            .map<IVNodeHash>(
                (rcts: [RenderCamera, Tag[], Tag]): IVNodeHash => {
                    return {
                        name: this._name,
                        vnode: this._tagDomRenderer.render(rcts[1], rcts[0].perspective),
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
        this._tagsSubscription.dispose();
        this._tagChangedSubscription.dispose();

        this._domSubscription.dispose();
        this._glSubscription.dispose();
    }

    private _computeRect(original: number[], newCoord: number[], operation: TagOperation): number[] {
        let rect: number[] = [];

        if (operation === TagOperation.Move) {
            let centerX: number = original[0] + (original[2] - original[0]) / 2;
            let centerY: number = original[1] + (original[3] - original[1]) / 2;

            let minTranslationX: number = -original[0];
            let maxTranslationX: number = 1 - original[2];
            let minTranslationY: number = -original[1];
            let maxTranslationY: number = 1 - original[3];

            let translationX: number = Math.max(minTranslationX, Math.min(maxTranslationX, newCoord[0] - centerX));
            let translationY: number = Math.max(minTranslationY, Math.min(maxTranslationY, newCoord[1] - centerY));

            rect[0] = original[0] + translationX;
            rect[1] = original[1] + translationY;
            rect[2] = original[2] + translationX;
            rect[3] = original[3] + translationY;
        } else {
            newCoord = [
                Math.max(0, Math.min(1, newCoord[0])),
                Math.max(0, Math.min(1, newCoord[1])),
            ];

            if (operation === TagOperation.ResizeBottomLeft) {
                rect[0] = newCoord[0];
                rect[1] = original[1];
                rect[2] = original[2];
                rect[3] = newCoord[1];
            } else if (operation === TagOperation.ResizeTopLeft) {
                rect[0] = newCoord[0];
                rect[1] = newCoord[1];
                rect[2] = original[2];
                rect[3] = original[3];
            } else if (operation === TagOperation.ResizeTopRight) {
                rect[0] = original[0];
                rect[1] = newCoord[1];
                rect[2] = newCoord[0];
                rect[3] = original[3];
            } else if (operation === TagOperation.ResizeBottomRight) {
                rect[0] = original[0];
                rect[1] = original[1];
                rect[2] = newCoord[0];
                rect[3] = newCoord[1];
            }
        }

        if (rect[0] > rect[2]) {
            rect[0] = original[0];
            rect[2] = original[2];
        }

        if (rect[1] > rect[3]) {
            rect[1] = original[1];
            rect[3] = original[3];
        }

        return rect;
    }
}

ComponentService.register(TagComponent);
export default TagComponent;
