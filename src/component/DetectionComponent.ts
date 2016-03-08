/// <reference path="../../typings/browser.d.ts" />

import * as rx from "rx";
import * as vd from "virtual-dom";

import {Node} from "../Graph";
import {Container, Navigator} from "../Viewer";
import {APIv3} from "../API";

import {ComponentService, Component} from "../Component";
import {IVNodeHash} from "../Render";

interface IDetection {
    rect: number[];
    score: string;
    value: string;
    object: string;
    key: string;
    package: string;
}

export class DetectionComponent extends Component {
    public static componentName: string = "detection";
    private _disposable: rx.IDisposable;
    private apiV3: APIv3;

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);
        this.apiV3 = navigator.apiV3;
    }

    protected _activate(): void {
        this._disposable = this._navigator.stateService.currentNode$.flatMap((node: Node): rx.Observable<any> => {
            return this.apiV3.model.get([
                "imageByKey",
                node.key,
                "ors",
                {from: 0, to: 20},
                ["key", "obj", "rect", "value", "package", "score"],
            ]);
        }).map((ors: any): IVNodeHash => {
            let detections: IDetection[] = [];
            delete ors.json.imageByKey.$__path;
            ors = ors.json.imageByKey[Object.keys(ors.json.imageByKey)[0]].ors;
            delete ors.$__path;

            for (let or in ors) {
                if (ors.hasOwnProperty(or)) {
                    or = ors[or];

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

            return {name: this._name, vnode: this.getRects(detections)};
        }).subscribe(this._container.domRenderer.render$);
    }

    protected _deactivate(): void {
        this._disposable.dispose();
    }

    private getRects(detections: IDetection[]): vd.VNode {
        let vRects: vd.VNode[] = [];

        detections.forEach((r: IDetection) => {
            let adjustedRect: number[] = this.coordsToCss(r.rect);

            let rectMapped: string[] = adjustedRect.map((el: number) => {
                return (el * 100) + "%";
            });

            vRects.push(vd.h("div.Rect", {style: this.getRectStyle(rectMapped)}, [
                vd.h("span", {style: "color: red;", textContent: r.value}, []),
            ]));
        });

        return vd.h("div.rectContainer", {}, vRects);
    }

    private coordsToCss(rects: number[]): number[] {
        let adjustedCoords: number[] = rects.concat();
        adjustedCoords[2] = 1 - adjustedCoords[2];
        adjustedCoords[3] = 1 - adjustedCoords[3];
        return adjustedCoords;
    }

    private getRectStyle(mappedRect: Array<string>): string {
        return `top:${mappedRect[1]}; bottom:${mappedRect[3]}; right:${mappedRect[2]}; left:${mappedRect[0]}`;
    }
}

ComponentService.register(DetectionComponent);
export default DetectionComponent;
