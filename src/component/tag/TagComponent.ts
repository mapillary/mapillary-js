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
    INodeTags,
    ITag,
    ITagData,
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
            .map<[string, string]>(
                (args: [MouseEvent, IActiveTag, RenderCamera, IFrame]): [string, string] => {
                    let mouseEvent: MouseEvent = args[0];
                    let activeTag: IActiveTag = args[1];
                    let renderCamera: RenderCamera = args[2];
                    let frame: IFrame = args[3];

                    let transform: Transform = frame.state.currentTransform;
                    let node: Node = frame.state.currentNode;

                    let element: HTMLElement = this._container.element;

                    let canvasX: number = mouseEvent.clientX - element.offsetLeft - activeTag.offsetX;
                    let canvasY: number = mouseEvent.clientY - element.offsetTop - activeTag.offsetY;

                    let projectedX: number = 2 * canvasX / element.offsetWidth - 1;
                    let projectedY: number = 1 - 2 * canvasY / element.offsetHeight;

                    let unprojected: THREE.Vector3 =
                        new THREE.Vector3(projectedX, projectedY, 1).unproject(renderCamera.perspective);

                    let newCoord: number[] = transform.projectBasic(unprojected.toArray());

                    activeTag.tag.polygonBasic =
                        this._computePolygonBasic(
                            activeTag.tag.polygonBasic,
                            newCoord,
                            activeTag.operation);

                    activeTag.tag.polygon3d = this._polygonTo3d(transform, activeTag.tag.polygonBasic);

                    return [node.key, activeTag.tag.key];
                })
            .subscribe(this._tagSet.change$);

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
                    this._tagSet.clearAll$.onNext(null);
                })
            .flatMapLatest<[string, ITag[]]>(
                (frame: IFrame): rx.Observable<[string, ITag[]]> => {
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
                        .map<[string, ITag[]]>(
                            (ors: any): [string, ITag[]] => {
                                let nodeKey: string = frame.state.currentNode.key;
                                let tags: ITag[] = this._computeTags(frame.state.currentTransform, ors);

                                return [nodeKey, tags];
                            });
                })
            .subscribe(this._tagSet.set$);

        let tags$: rx.Observable<ITag[]> = this._navigator.stateService.currentNode$
            .flatMapLatest<ITag[]>(
                (node: Node): rx.Observable<ITag[]> => {
                    return this._tagSet.tagData$
                        .map<INodeTags>(
                            (tagData: ITagData): INodeTags => {
                                return tagData[node.key];
                            })
                        .map<ITag[]>(
                            (nodeTags: INodeTags): ITag[] => {
                                if (nodeTags == null) {
                                    return [];
                                }

                                let tags: ITag[] = [];

                                for (let key in nodeTags.approve) {
                                    if (nodeTags.approve.hasOwnProperty(key)) {
                                        tags.push(nodeTags.approve[key]);
                                    }
                                }

                                for (let key in nodeTags.change) {
                                    if (nodeTags.change.hasOwnProperty(key)) {
                                        tags.push(nodeTags.change[key]);
                                    }
                                }

                                for (let key in nodeTags.create) {
                                    if (nodeTags.create.hasOwnProperty(key)) {
                                        tags.push(nodeTags.create[key]);
                                    }
                                }

                                // ensure that tags are always rendered in the same order
                                // to avoid hover tracking problems on first resize.
                                tags.sort((first: ITag, second: ITag): number => {
                                    if (first.key > second.key) {
                                        return 1;
                                    }

                                    if (first.key < second.key) {
                                        return -1;
                                    }

                                    return 0;
                                });

                                return tags;
                            });
                })
            .share();

        tags$
            .map<ITagGLRendererOperation>(
                (tags: ITag[]): ITagGLRendererOperation => {
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
                (rc: RenderCamera, tags: ITag[]): [RenderCamera, ITag[]] => {
                    return [rc, tags];
                })
            .map<IVNodeHash>(
                (rcts: [RenderCamera, ITag[]]): IVNodeHash => {
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

    private _computeTags(transform: Transform, ors: any): ITag[] {
        let tags: ITag[] = [];
        delete ors.json.imageByKey.$__path;
        ors = ors.json.imageByKey[Object.keys(ors.json.imageByKey)[0]].ors;
        delete ors.$__path;

        for (let key in ors) {
            if (ors.hasOwnProperty(key)) {
                let or: any = ors[key];
                if (or) {
                    let polygonBasic: number[][] = [];

                    for (let coordinate of or.rect.geometry.coordinates) {
                        polygonBasic.push(coordinate.slice());
                    }

                    let polygon3d: number[][] = this._polygonTo3d(transform, polygonBasic);

                    tags.push({
                        key: or.key,
                        object: or.obj,
                        package: or.package,
                        polygon3d: polygon3d,
                        polygonBasic: polygonBasic,
                        score: or.score,
                        value: or.value,
                    });
                }
            }
        }

        return tags;
    }

    private _computePolygonBasic(original: number[][], newCoord: number[], operation: TagOperation): number[][] {
        let polygonBasic: number[][] = [];

        if (operation === TagOperation.Move) {
            let centerX: number = original[1][0] + (original[3][0] - original[1][0]) / 2;
            let centerY: number = original[1][1] + (original[3][1] - original[1][1]) / 2;

            let translationX: number = newCoord[0] - centerX;
            let translationY: number = newCoord[1] - centerY;

            polygonBasic[0] = [original[0][0] + translationX, original[0][1] + translationY];
            polygonBasic[1] = [original[1][0] + translationX, original[1][1] + translationY];
            polygonBasic[2] = [original[2][0] + translationX, original[2][1] + translationY];
            polygonBasic[3] = [original[3][0] + translationX, original[3][1] + translationY];
            polygonBasic[4] = [original[4][0] + translationX, original[4][1] + translationY];

        } else if (operation === TagOperation.ResizeTopLeft) {
            newCoord = [
                Math.max(0, Math.min(1, newCoord[0])),
                Math.max(0, Math.min(1, newCoord[1])),
            ];

            polygonBasic[0] = [newCoord[0], original[0][1]];
            polygonBasic[1] = [newCoord[0], newCoord[1]];
            polygonBasic[2] = [original[2][0], newCoord[1]];
            polygonBasic[3] = [original[3][0], original[3][1]];
            polygonBasic[4] = [newCoord[0], original[4][1]];
        }

        return polygonBasic;
    }

    private _polygonTo3d(transform: Transform, polygonBasic: number[][]): number[][] {
        let polygon3d: number[][] = polygonBasic.map((point: number[]) => {
            return transform.unprojectBasic(point, 200);
        });

        return polygon3d;
    }
}

ComponentService.register(TagComponent);
export default TagComponent;
