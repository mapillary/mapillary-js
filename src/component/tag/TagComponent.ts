/// <reference path="../../../typings/browser.d.ts" />

import * as rx from "rx";

import {Node} from "../../Graph";
import {Container, Navigator} from "../../Viewer";
import {APIv3} from "../../API";
import {
    ComponentService,
    Component,
    INodeTags,
    ITag,
    ITagData,
    TagDOMRenderer,
    TagGLRenderer,
    TagSet,
} from "../../Component";
import {Transform} from "../../Geo";
import {RenderCamera, IVNodeHash, IGLRenderHash, GLRenderStage} from "../../Render";
import {IFrame} from "../../State";

interface IGlUpdateArgs {
    frame: IFrame;
    tags: ITag[];
}

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
                (e: MouseEvent, tag: ITag): [MouseEvent, ITag] => {
                    return [e, tag];
                })
            .subscribe((et: [MouseEvent, ITag]): void => { return; });

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
                    let polygonBasic: number[][] = or.rect.geometry.coordinates;
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

    private _polygonTo3d(transform: Transform, polygonBasic: number[][]): number[][] {
        let polygon3d: number[][] = polygonBasic.map((point: number[]) => {
            return transform.unprojectBasic(point, 200);
        });

        return polygon3d;
    }
}

ComponentService.register(TagComponent);
export default TagComponent;
