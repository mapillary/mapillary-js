/// <reference path="../../typings/browser.d.ts" />

import * as rx from "rx";
import * as vd from "virtual-dom";

import {Node} from "../Graph";
import {Container, Navigator} from "../Viewer";
import {APIv3} from "../API";

import {ComponentService, Component} from "../Component";
import {IGLRenderHash, GLRenderStage} from "../Render";
import {IFrame} from "../State";

interface ITag {
    rect: number[];
    score: string;
    value: string;
    object: string;
    key: string;
    package: string;
}

interface ITagUpdateArgs {
    frame: IFrame;
    tags3d: ITag3d[];
}

interface IDetection {
    rect: number[];
    score: string;
    value: string;
    object: string;
    key: string;
    package: string;
}

interface ITag3d {
    polygon: number[][];
    score: string;
    value: string;
    object: string;
    key: string;
    package: string;
}

export class TagComponent extends Component {
    public static componentName: string = "tag";
    private _disposable: rx.IDisposable;
    private _apiV3: APIv3;

    private _vNode: vd.VNode;

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);
        this._apiV3 = navigator.apiV3;
        this._vNode = null;
    }

    protected _activate(): void {
        let tags$: rx.Observable<any> = this._navigator.stateService.currentNode$.flatMap((node: Node): rx.Observable<any> => {
            return this._apiV3.model.get([
                "imageByKey",
                node.key,
                "ors",
                { from: 0, to: 20 },
                ["key", "obj", "rect", "value", "package", "score"],
            ]);
        });

        let tags3d$: rx.Observable<ITag3d[]> = rx.Observable.combineLatest(
            this._navigator.stateService.currentNode$,
            tags$,
            (node: Node, tags: any): ITag3d[] => {
                return this._computeTags3d(node, tags);
            });

        this._disposable = rx.Observable.combineLatest(
                this._navigator.stateService.currentState$,
                tags3d$,
                (frame: IFrame, tags3d: ITag3d[]): ITagUpdateArgs => {
                    return { frame: frame, tags3d: tags3d };
                }
            ).distinctUntilChanged((args: ITagUpdateArgs) => {
                return args.frame.state.camera.lookat.x;
            })
            .map<IGLRenderHash>(this._renderHash.bind(this))
            .subscribe(this._container.glRenderer.render$);
    }

    protected _deactivate(): void {
        this._disposable.dispose();
    }

    private _renderHash(args: ITagUpdateArgs): IGLRenderHash {
        // determine if render is needed while updating scene
        // specific properies.
        let needsRender: boolean = this._updateScene(args);

        // return render hash with render function and
        // render in foreground.
        return {
            name: this._name,
            render: {
                frameId: args.frame.id,
                needsRender: needsRender,
                render: this._render.bind(this),
                stage: GLRenderStage.Foreground,
            },
        };
    }

    private _computeTags3d(node: Node, tags: any): ITag3d[]  {

        let ors: any = tags;
        let tags3d: ITag3d[] = [];
        delete ors.json.imageByKey.$__path;
        ors = ors.json.imageByKey[Object.keys(ors.json.imageByKey)[0]].ors;
        delete ors.$__path;

        for (let key in ors) {
            if (ors.hasOwnProperty(key)) {
                let or: any = ors[key];

                if (!or) {
                    continue;
                }

                let polygon: number[][] = this._rectToPolygon3d(
                    node, or.rect.geometry.coordinates);


                let tag3d: ITag3d = {
                    key: or.key,
                    object: or.obj,
                    package: or.package,
                    polygon: polygon,
                    score: or.score,
                    value: or.value,
                };
                tags3d.push(tag3d);
            }
        }

        return tags3d;
    }

    private _rectToPolygon3d(node: Node, points: number[][]): number[][] {
        // todo(pau): Compute 3D tags here
        return points;
    }

    private _updateScene(args: ITagUpdateArgs): boolean {
        this._vNode = this._getRects(args.tags3d);
        return true;
    }

    private _render(
        perspectiveCamera: THREE.PerspectiveCamera,
        renderer: THREE.WebGLRenderer): void {

        console.log("render");

        this._container.domRenderer.renderAdaptive$.onNext({ name: this._name, vnode: this._vNode });
    }

    private _getRects(tags3d: ITag3d[]): vd.VNode {
        let vRects: vd.VNode[] = [];

        tags3d.forEach((r: ITag3d) => {
            let rect: number[] = [];
            rect[0] = r.polygon[1][0];
            rect[1] = r.polygon[1][1];
            rect[2] = r.polygon[3][0];
            rect[3] = r.polygon[3][1];

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
