/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />

import * as rx from "rx";
import * as vd from "virtual-dom";

import {EdgeDirection} from "../Edge";
import {Node} from "../Graph";
import {Container, Navigator} from "../Viewer";

import {UI} from "../UI";
import {IVNodeHash} from "../Render";

export class DirectionsUI extends UI {
    public static uiName: string = "directions";

    private _disposable: rx.IDisposable;
    private _dirNames: {[dir: number]: string};
    private _cssOffset: number;

    private _staticArrows: {[dir: number]: number};

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);

        this._cssOffset = 62;

        this._dirNames = {};
        this._dirNames[EdgeDirection.STEP_FORWARD] = "Forward";
        this._dirNames[EdgeDirection.STEP_BACKWARD] = "Backward";
        this._dirNames[EdgeDirection.STEP_LEFT] = "Left";
        this._dirNames[EdgeDirection.STEP_RIGHT] = "Right";

        this._staticArrows = {};
        this._staticArrows[EdgeDirection.STEP_FORWARD] = 0;
        this._staticArrows[EdgeDirection.STEP_BACKWARD] = 180;
        this._staticArrows[EdgeDirection.STEP_LEFT] = 3 * 180 / 2;
        this._staticArrows[EdgeDirection.STEP_RIGHT] = 180 / 2;
    }

    protected _activate(): void {
        this._disposable = this._navigator.stateService.currentNode$.map((node: Node): IVNodeHash => {
                let btns: vd.VNode[] = [];

                for (let edge of node.edges) {

                    let direction: EdgeDirection = edge.data.direction;
                    let name: string = this._dirNames[direction];

                    if (name == null) { continue; }

                    let angle: number = this._staticArrows[direction];
                    btns.push(this.createVNode(direction, angle));
                }

                return {name: "directions", vnode: this.getVNodeContainer(btns)};
            }).subscribe(this._container.domRenderer.render$);
    }

    protected _deactivate(): void {
        this._disposable.dispose();
    }

    private calcTranslation(angle: number): Array<number> {
        let radianAngle: number = (angle - 90) * Math.PI / 180;
        let x: number = Math.cos(radianAngle);
        let y: number = Math.sin(radianAngle);

        return [x, y];
    }

    private createVNode(direction: EdgeDirection, angle: number): vd.VNode {
        let translation: Array<number> = this.calcTranslation(angle);
        let translationWithOffsetX: number = this._cssOffset * translation[0];
        let translationWithOffsetY: number = this._cssOffset * translation[1];

        let dropShadowOffset: number = 3; // px
        let dropShadowTranslatedY: number = -dropShadowOffset * translation[1];
        let dropShadowTranslatedX: number = dropShadowOffset * translation[0];
        let filterValue: string = `drop-shadow(${dropShadowTranslatedX}px ${dropShadowTranslatedY}px 3px rgba(0,0,0,0.8))`;

        let style: any = {
            "-webkit-filter": filterValue,
            filter: filterValue,
            transform: `translate(${translationWithOffsetX}px, ${translationWithOffsetY}px) rotate(${angle}deg)`,
        };

        return vd.h(`div.DirectionsArrow.`,
                    {
                        onclick: (ev: Event): void => { this._navigator.moveDir(direction).first().subscribe(); },
                        style: style,
                    },
                    []);
    }

    private getVNodeContainer(children: any): any {
        let style: any = {
            transform: "perspective(375px) rotateX(65deg) rotateZ(0deg)" // todo: change the rotateX value for panoramas
        };

        return vd.h("div.Directions", {style: style}, children);
    }
}

export default DirectionsUI;
