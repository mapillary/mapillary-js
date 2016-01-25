/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="../../typings/threejs/three.d.ts" />
/// <reference path="../../typings/virtual-dom/virtual-dom.d.ts" />

import * as rx from "rx";
import * as THREE from "three";
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
    private dropShadowOffset: number;

    private currentKey: string;
    private currentDirection: THREE.Vector3;
    private directionEpsilon: number;

    // { direction: angle }
    private staticArrows: {[dir: number]: number};

    constructor(container: Container, navigator: Navigator) {
        this.container = container;
        this.navigator = navigator;

        this.spatial = new Spatial();

        this.currentKey = null;
        this.currentDirection = new THREE.Vector3();
        this.directionEpsilon = 0.015;

        // cssOffset is a magic number in px
        this.cssOffset = 62;
        this.dropShadowOffset = 3;

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

                let camera: Camera = frame.state.camera;
                let direction: THREE.Vector3 = camera.lookat.clone().sub(camera.position);

                if (node == null ||
                    (node.key === this.currentKey &&
                    this.currentDirection.distanceToSquared(direction) < this.directionEpsilon)) {
                    return null;
                }

                this.currentKey = node.key;
                this.currentDirection.copy(direction);

                let phi: number = node.pano ? this.rotationFromCamera(frame.state.camera).phi : 0;

                let btns: vd.VNode[] = this.createStaticStepArrows(node, phi);
                btns = btns.concat(this.createPanoArrows(node, phi));

                return {name: "directions", vnode: this.getVNodeContainer(btns, phi)};
            })
            .filter((hash: IVNodeHash): boolean => { return hash != null; })
            .subscribe(this.container.domRenderer.render$);
    }

    public deactivate(): void {
        return;
    }

    private createStaticStepArrows(node: Node, phi: number): Array<vd.VNode> {
        let btns: Array<vd.VNode> = [];

        for (let edge of node.edges) {

            let direction: EdgeDirection = edge.data.direction;
            let name: string = this.dirNames[direction];

            if (name == null) { continue; }

            let angle: number = this.staticArrows[direction];
            btns.push(this.createVNodeByDirection(angle, phi, direction));
        }

        return btns;
    }

    private createPanoArrows(node: Node, phi: number): Array<vd.VNode> {
        let btns: Array<vd.VNode> = [];

        for (let edge of node.edges) {
            if (edge.data.direction !== EdgeDirection.PANO) {
                continue;
            }

            btns.push(this.createVNodeByKey(edge.data.worldMotionAzimuth, phi, edge.to));
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
        return [Math.cos(angle), Math.sin(angle)];
    }

    private calcShadowTranslation(azimuth: number, phi: number): Array<number> {
        let angle: number = this.spatial.wrapAngle(azimuth - phi);

        return this.calcTranslation(angle);
    }

    private createVNodeByKey(azimuth: number, phi: number, key: string): vd.VNode {
        let onClick: (e: Event) => void =
            (e: Event): void => { this.navigator.moveToKey(key).first().subscribe(); };

        return this.createVNode(azimuth, phi, onClick);
    }

    private createVNodeByDirection(azimuth: number, phi: number, direction: EdgeDirection): vd.VNode {
        let onClick: (e: Event) => void =
            (e: Event): void => { this.navigator.moveDir(direction).first().subscribe(); };

        return this.createVNode(azimuth, phi, onClick);
    }

    private createVNode(azimuth: number, phi: number, onClick: (e: Event) => void): vd.VNode {
        let translation: Array<number> = this.calcTranslation(azimuth);

        // rotate 90 degrees clockwise and flip over X-axis
        let translationX: number = -this.cssOffset * translation[1];
        let translationY: number = -this.cssOffset * translation[0];

        let shadowTranslation: Array<number> = this.calcShadowTranslation(azimuth, phi);
        let shadowTranslationX: number = -this.dropShadowOffset * shadowTranslation[1];
        let shadowTranslationY: number = this.dropShadowOffset * shadowTranslation[0];

        let azimuthDeg: number = -this.spatial.radToDeg(azimuth);

        let filter: string = `drop-shadow(${shadowTranslationX}px ${shadowTranslationY}px 3px rgba(0,0,0,0.8))`;
        let transform: string = `translate(${translationX}px, ${translationY}px) rotate(${azimuthDeg}deg)`;

        return vd.h(
            "div.DirectionsArrow.",
            {
                onclick: onClick,
                style: {
                    "-webkit-filter": filter,
                    filter: filter,
                    transform: transform,
                },
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
