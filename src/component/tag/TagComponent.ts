/// <reference path="../../../typings/browser.d.ts" />

import * as rx from "rx";
import * as THREE from "three";

import {Node} from "../../Graph";
import {Container, Navigator} from "../../Viewer";
import {APIv3} from "../../API";
import {
    ComponentService,
    Component,
    IActiveTag,
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
    }

    protected _activate(): void {
        this._tagDomRenderer.editInitiated$
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

        this._container.mouseService.filtered$(this._name, this._container.mouseService.mouseDrag$)
            .withLatestFrom(
                this._tagDomRenderer.activeTag$,
                this._container.renderService.renderCamera$,
                this._navigator.stateService.currentState$,
                (
                    event: MouseEvent,
                    activeTag: IActiveTag,
                    renderCamera: RenderCamera,
                    frame: IFrame):
                    [MouseEvent, IActiveTag, RenderCamera, IFrame] => {
                    return [event, activeTag, renderCamera, frame];
                })
            .map<void>(
                (args: [MouseEvent, IActiveTag, RenderCamera, IFrame]): void => {
                    let mouseEvent: MouseEvent = args[0];
                    let activeTag: IActiveTag = args[1];
                    let renderCamera: RenderCamera = args[2];
                    let frame: IFrame = args[3];

                    let transform: Transform = frame.state.currentTransform;

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
                })
            .subscribe(this._tagSet.notifyTagChanged$);

        this._container.mouseService.filtered$(this._name, this._container.mouseService.mouseDragEnd$)
            .subscribe((e: MouseEvent): void => {
                this._container.mouseService.unclaimMouse(this._name);
             });

        this._navigator.stateService.currentState$
            .distinctUntilChanged(
                (frame: IFrame): string => {
                    return frame.state.currentNode.key;
                })
            .do(
                (frame: IFrame): void => {
                    this._tagSet.set$.onNext([]);
                })
            .flatMapLatest<Tag[]>(
                (frame: IFrame): rx.Observable<Tag[]> => {
                    return rx.Observable
                        .fromPromise<any>(
                            this._apiV3.model
                                .get([
                                    "imageByKey",
                                    frame.state.currentNode.key,
                                    "ors",
                                    { from: 0, to: 20 },
                                    ["key", "obj", "rect", "value", "package", "score"],
                                ]))
                        .map<Tag[]>(
                            (ors: any): Tag[] => {
                                let tags: Tag[] = this._computeTags(frame.state.currentTransform, ors);

                                return tags;
                            });
                })
            .subscribe(this._tagSet.set$);

        let tags$: rx.Observable<Tag[]> = this._navigator.stateService.currentNode$
            .flatMapLatest<Tag[]>(
                (node: Node): rx.Observable<Tag[]> => {
                    return this._tagSet.tagData$
                        .map<Tag[]>(
                            (tagData: { [id: string]: Tag }): Tag[] => {
                                let tags: Tag[] = [];

                                // ensure that tags are always rendered in the same order
                                // to avoid hover tracking problems on first resize.
                                for (let key of Object.keys(tagData).sort()) {
                                   tags.push(tagData[key]);
                                }

                                return tags;
                            });
                })
            .share();

        tags$
            .map<ITagGLRendererOperation>(
                (tags: Tag[]): ITagGLRendererOperation => {
                    return (renderer: TagGLRenderer): TagGLRenderer => {
                        renderer.updateTags(tags);

                        return renderer;
                    };
                })
            .subscribe(this._tagGlRendererOperation$);

        this._domSubscription = rx.Observable
            .combineLatest(
                this._container.renderService.renderCamera$,
                tags$,
                (rc: RenderCamera, tags: Tag[]): [RenderCamera, Tag[]] => {
                    return [rc, tags];
                })
            .map<IVNodeHash>(
                (rcts: [RenderCamera, Tag[]]): IVNodeHash => {
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

        this._domSubscription.dispose();
        this._glSubscription.dispose();
    }

    private _computeTags(transform: Transform, ors: any): Tag[] {
        let tags: Tag[] = [];
        delete ors.json.imageByKey.$__path;
        ors = ors.json.imageByKey[Object.keys(ors.json.imageByKey)[0]].ors;
        delete ors.$__path;

        for (let key in ors) {
            if (!ors.hasOwnProperty(key)) {
                continue;
            }

            let or: any = ors[key];
            if (!or) {
                continue;
            }

            let rect: number[] = [];

            rect[0] = or.rect.geometry.coordinates[1][0];
            rect[1] = or.rect.geometry.coordinates[1][1];
            rect[2] = or.rect.geometry.coordinates[3][0];
            rect[3] = or.rect.geometry.coordinates[3][1];

            let tag: Tag = new Tag(
                or.key,
                transform,
                rect,
                or.value
            );

            tags.push(tag);
        }

        return tags;
    }

    private _computeRect(original: number[], newCoord: number[], operation: TagOperation): number[] {
        let rect: number[] = [];

        if (operation === TagOperation.Move) {
            let centerX: number = original[0] + (original[2] - original[0]) / 2;
            let centerY: number = original[1] + (original[3] - original[1]) / 2;

            let translationX: number = newCoord[0] - centerX;
            let translationY: number = newCoord[1] - centerY;

            rect[0] = original[0] + translationX;
            rect[1] = original[1] + translationY;
            rect[2] = original[2] + translationX;
            rect[3] = original[3] + translationY;

        }

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

        return rect;
    }
}

ComponentService.register(TagComponent);
export default TagComponent;
