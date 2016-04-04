/// <reference path="../../typings/browser.d.ts" />

import * as THREE from "three";

import * as rx from "rx";
import * as vd from "virtual-dom";

import {Container, Navigator} from "../Viewer";
import {APIv3} from "../API";

import {ComponentService, Component} from "../Component";
import {Transform} from "../Geo";
import {RenderCamera, IVNodeHash, IGLRenderHash, GLRenderStage} from "../Render";
import {IFrame} from "../State";

interface IGlUpdateArgs {
    frame: IFrame;
    tags: ITag[];
}

interface IDomUpdateArgs {
    renderCamera: RenderCamera;
    tags: ITag[];
}

interface ITag {
    key: string;
    object: string;
    package: string;
    polygon3d: number[][];
    polygonBasic: number[][];
    score: string;
    value: string;
}

export class TagComponent extends Component {
    public static componentName: string = "tag";
    private _glDisposable: rx.IDisposable;
    private _domDisposable: rx.IDisposable;
    private _apiV3: APIv3;

    private _tags: ITag[];

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);
        this._apiV3 = navigator.apiV3;
        this._tags = null;
    }

    protected _activate(): void {
        let tags$: rx.Observable<ITag[]> = this._navigator.stateService.currentState$
            .distinctUntilChanged(
                (frame: IFrame): string => {
                    return frame.state.currentNode.key;
                })
            .flatMapLatest(
                (frame: IFrame): rx.Observable<ITag[]> => {
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
                        .map<ITag[]>(
                            (ors: any): ITag[] => {
                                return this._computeTags(frame.state.currentTransform, ors);
                            });
                });

        // le DOM render
        rx.Observable
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
                        vnode: this._getRects(rcts[1], rcts[0].perspective),
                    };
                })
            .subscribe(this._container.domRenderer.render$);

        // le GL render
        this._glDisposable = rx.Observable
            .combineLatest(
                this._navigator.stateService.currentState$,
                tags$,
                (frame: IFrame, tags: ITag[]): IGlUpdateArgs => {
                    return { frame: frame, tags: tags };
                })
            .map<IGLRenderHash>(this._renderHash.bind(this))
            .subscribe(this._container.glRenderer.render$);
    }

    protected _deactivate(): void {
        this._domDisposable.dispose();
        this._glDisposable.dispose();
    }

    private _renderHash(args: IGlUpdateArgs): IGLRenderHash {
        // save tags for later when the render function will be called
        this._tags = args.tags;

        // return render hash with render function and
        // render in foreground.
        return {
            name: this._name,
            render: {
                frameId: args.frame.id,
                needsRender: false,
                render: this._render.bind(this),
                stage: GLRenderStage.Foreground,
            },
        };
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

    private _render(
        perspectiveCamera: THREE.PerspectiveCamera,
        renderer: THREE.WebGLRenderer): void {
        console.log("todo");
    }

    private _projectToCanvas(point: number[], camera: THREE.PerspectiveCamera): number[] {
        let v: THREE.Vector3 = new THREE.Vector3(point[0], point[1], point[2]);
        v.project(camera);
        return [(v.x + 1) / 2, (-v.y + 1) / 2];
    }

    private _getRects(tags: ITag[], camera: THREE.PerspectiveCamera): vd.VNode {
        let vRects: vd.VNode[] = [];

        tags.forEach((r: ITag) => {
            let rect: number[] = [];
            let topLeft: number[] = this._projectToCanvas(r.polygon3d[1], camera);
            let bottomRight: number[] = this._projectToCanvas(r.polygon3d[3], camera);
            rect[0] = topLeft[0];
            rect[1] = topLeft[1];
            rect[2] = bottomRight[0];
            rect[3] = bottomRight[1];

            let adjustedRect: number[] = this._coordsToCss(rect);

            let rectMapped: string[] = adjustedRect.map((el: number) => {
                return (el * 100) + "%";
            });

            vRects.push(vd.h("div.Rect", {style: this._getRectStyle(rectMapped)}, [
                vd.h("span", {style: "color: red;", textContent: r.value}, []),
            ]));
        });

        return vd.h("div.rectContainer", {}, vRects);
    }

    private _coordsToCss(rects: number[]): number[] {
        let adjustedCoords: number[] = rects.concat();
        adjustedCoords[2] = 1 - adjustedCoords[2];
        adjustedCoords[3] = 1 - adjustedCoords[3];
        return adjustedCoords;
    }

    private _getRectStyle(mappedRect: Array<string>): string {
        return `top:${mappedRect[1]}; bottom:${mappedRect[3]}; right:${mappedRect[2]}; left:${mappedRect[0]}`;
    }
}

ComponentService.register(TagComponent);
export default TagComponent;
