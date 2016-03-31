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
    ors: any;
}

interface IDetection {
    rect: number[];
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

        this._disposable = rx.Observable.combineLatest(
                this._navigator.stateService.currentState$,
                tags$,
                (frame: IFrame, ors: any): ITagUpdateArgs => {
                    return { frame: frame, ors: ors };
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

    private _updateScene(args: ITagUpdateArgs): boolean {
        let ors: any = args.ors;
        let detections: IDetection[] = [];
        delete ors.json.imageByKey.$__path;
        ors = ors.json.imageByKey[Object.keys(ors.json.imageByKey)[0]].ors;
        delete ors.$__path;

        for (let key in ors) {
            if (ors.hasOwnProperty(key)) {
                let or: any = ors[key];

                if (!or) {
                    continue;
                }

                let r: number[] = [];
                r[0] = or.rect.geometry.coordinates[1][0];
                r[1] = or.rect.geometry.coordinates[1][1];
                r[2] = or.rect.geometry.coordinates[3][0];
                r[3] = or.rect.geometry.coordinates[3][1];

                let rect: IDetection = {
                    key: or.key,
                    object: or.obj,
                    package: or.package,
                    rect: r,
                    score: or.score,
                    value: or.value,
                };
                detections.push(rect);
            }
        }

        this._vNode = this._getRects(detections);

        return true;
    }

    private _render(
        perspectiveCamera: THREE.PerspectiveCamera,
        renderer: THREE.WebGLRenderer): void {

        console.log("render");

        this._container.domRenderer.renderAdaptive$.onNext({ name: this._name, vnode: this._vNode });
    }

    private _getRects(detections: IDetection[]): vd.VNode {
        let vRects: vd.VNode[] = [];

        detections.forEach((r: IDetection) => {
            let adjustedRect: number[] = this._coordsToCss(r.rect);

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
