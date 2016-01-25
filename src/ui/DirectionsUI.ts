/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />

import * as rx from "rx";
import * as vd from "virtual-dom";

import {EdgeDirection} from "../Edge";
import {Node} from "../Graph";
import {Container, Navigator} from "../Viewer";
import {IFrame} from "../State";
import {Spatial, Camera} from "../Geo";

import {IUI} from "../UI";
import {IVNodeHash} from "../Render";

interface IRotation {
    phi: number;
    theta: number;
}

export class DirectionsUI implements IUI {
    private navigator: Navigator;
    private container: Container;

    private spatial: Spatial;

    private subscription: rx.IDisposable;
    private dirNames: {[dir: number]: string};
    private cssOffset: number;

    private currentKey: string;

    // { direction: angle }
    private staticArrows: {[dir: number]: number};

    constructor(container: Container, navigator: Navigator) {
        this.container = container;
        this.navigator = navigator;

        this.spatial = new Spatial();

        this.currentKey = null;

        // cssOffset is a magic number in px
        this.cssOffset = 62;

        this.dirNames = {};
        this.dirNames[EdgeDirection.STEP_FORWARD] = "Forward";
        this.dirNames[EdgeDirection.STEP_BACKWARD] = "Backward";
        this.dirNames[EdgeDirection.STEP_LEFT] = "Left";
        this.dirNames[EdgeDirection.STEP_RIGHT] = "Right";

        this.staticArrows = {};
        this.staticArrows[EdgeDirection.STEP_FORWARD] = 0;
        this.staticArrows[EdgeDirection.STEP_LEFT] = Math.PI / 2;
        this.staticArrows[EdgeDirection.STEP_BACKWARD] = Math.PI;
        this.staticArrows[EdgeDirection.STEP_RIGHT] = 3 * Math.PI / 2;
    }

    public activate(): void {
        this.subscription = this.navigator.stateService.currentState$
            .map((frame: IFrame): IVNodeHash => {
                let node: Node = frame.state.currentNode;

                if (node == null || node.key === this.currentKey) {
                    return null;
                }

                this.currentKey = node.key;

                let btns: vd.VNode[] = this.createStaticStepArrows(node);
                btns = btns.concat(this.createPanoArrows(node));

                let phi: number = node.pano ? this.rotationFromCamera(frame.state.camera).phi : 0;

                return {name: "directions", vnode: this.getVNodeContainer(btns, phi)};
            })
            .filter((hash: IVNodeHash): boolean => { return hash != null; })
            .subscribe(this.container.domRenderer.render$);
    }

    public deactivate(): void {
        return;
    }

    private createStaticStepArrows(node: Node): Array<vd.VNode> {
        let btns: Array<vd.VNode> = [];

        for (let edge of node.edges) {

            let direction: EdgeDirection = edge.data.direction;
            let name: string = this.dirNames[direction];

            if (name == null) { continue; }

            let angle: number = this.staticArrows[direction];
            btns.push(this.createVNode(direction, angle));
        }

        return btns;
    }

    private createPanoArrows(node: Node): Array<vd.VNode> {
        let btns: Array<vd.VNode> = [];

        for (let edge of node.edges) {
            if (edge.data.direction !== EdgeDirection.PANO) {
                continue;
            }

            btns.push(this.createPanoVNode(edge.data.worldMotionAzimuth, edge.to));
        }

        return btns;
    }

    private rotationFromCamera(camera: Camera): IRotation {
        let direction: THREE.Vector3 = camera.lookat.clone().sub(camera.position);

        let upProjection: number = direction.clone().dot(camera.up);
        let planeProjection: THREE.Vector3 = direction.clone().sub(camera.up.clone().multiplyScalar(upProjection));

        let phi: number = Math.atan2(planeProjection.y, planeProjection.x);
        let theta: number = Math.PI / 2 - this.spatial.angleToPlane(direction.toArray(), [0, 0, 1]);

        return { phi: phi, theta: theta };
    }

    private calcTranslation(angle: number): Array<number> {
        let x: number = Math.cos(angle);
        let y: number = Math.sin(angle);

        return [x, y];
    }

    private createPanoVNode(azimuth: number, toKey: string): vd.VNode {
        let translation: number[] = this.calcTranslation(azimuth);

        // rotate 90 degrees clockwise and flip over X-axis
        let translationX: number = -this.cssOffset * translation[1];
        let translationY: number = -this.cssOffset * translation[0];

        let azimuthDeg: number = -180 * azimuth / Math.PI;

        return vd.h(
            "div.DirectionsArrow.",
            {
                onclick: (ev: Event): void => { this.navigator.moveToKey(toKey).first().subscribe(); },
                style: {
                    transform: `translate(${translationX}px, ${translationY}px) rotate(${azimuthDeg}deg)`
                },
            },
            []);
    }

    private createVNode(direction: EdgeDirection, angle: number): vd.VNode {
        let translation: Array<number> = this.calcTranslation(angle);
        let translationWithOffsetX: number = -this.cssOffset * translation[1];
        let translationWithOffsetY: number = -this.cssOffset * translation[0];

        let dropShadowOffset: number = 3; // px
        let dropShadowTranslatedY: number = dropShadowOffset * translation[0];
        let dropShadowTranslatedX: number = -dropShadowOffset * translation[1];
        let filterValue: string = `drop-shadow(${dropShadowTranslatedX}px ${dropShadowTranslatedY}px 3px rgba(0,0,0,0.8))`;

        let angleDeg: number = -180 * angle / Math.PI;

        let style: any = {
            "-webkit-filter": filterValue,
            filter: filterValue,
            transform: `translate(${translationWithOffsetX}px, ${translationWithOffsetY}px) rotate(${angleDeg}deg)`,
        };

        return vd.h(`div.DirectionsArrow.`,
                    {
                        onclick: (ev: Event): void => { this.navigator.moveDir(direction).first().subscribe(); },
                        style: style,
                    },
                    []);
    }

    private getVNodeContainer(children: any, rotateZ: number): any {
        let rotateZDeg: number = 180 * rotateZ / Math.PI;

        // todo: change the rotateX value for panoramas
        let style: any = {
            transform: `perspective(375px) rotateX(60deg) rotateZ(${rotateZDeg}deg)`
        };

        return vd.h("div.Directions", {style: style}, children);
    }
}

export default DirectionsUI;
