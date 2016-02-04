/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="../../typings/threejs/three.d.ts" />
/// <reference path="../../typings/virtual-dom/virtual-dom.d.ts" />

import * as rx from "rx";
import * as THREE from "three";
import * as vd from "virtual-dom";

import {EdgeDirection} from "../Edge";
import {Node} from "../Graph";
import {Container, Navigator} from "../Viewer";
import {IFrame, IRotation} from "../State";
import {Spatial, Camera} from "../Geo";

import {UIService, UI} from "../UI";
import {IVNodeHash} from "../Render";

export class DirectionsUI extends UI {
    public static uiName: string = "directions";

    private spatial: Spatial;

    private _disposable: rx.IDisposable;

    private arrowOffset: number;
    private innerArrowOffset: number;
    private dropShadowOffset: number;

    private currentKey: string;
    private currentPlaneRotation: number;
    private currentUpRotation: number;
    private rotationEpsilon: number;

    private steps: Array<EdgeDirection>;
    private turns: Array<EdgeDirection>;
    private turnNames: {[dir: number]: string};

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);

        // cssOffset is a magic number in px
        this.arrowOffset = 62;
        this.innerArrowOffset = 25;
        this.dropShadowOffset = 3;

        this.steps = [
            EdgeDirection.STEP_FORWARD,
            EdgeDirection.STEP_BACKWARD,
            EdgeDirection.STEP_LEFT,
            EdgeDirection.STEP_RIGHT,
        ];

        this.turns = [
            EdgeDirection.TURN_LEFT,
            EdgeDirection.TURN_RIGHT,
            EdgeDirection.TURN_U,
        ];

        this.turnNames = {};
        this.turnNames[EdgeDirection.TURN_LEFT] = "TurnLeft";
        this.turnNames[EdgeDirection.TURN_RIGHT] = "TurnRight";
        this.turnNames[EdgeDirection.TURN_U] = "TurnAround";

    }

    protected _activate(): void {
        this.spatial = new Spatial();

        this.currentKey = null;
        this.currentPlaneRotation = 0;
        this.currentUpRotation = 0;
        this.rotationEpsilon = 0.5 * Math.PI / 180;

        this._disposable = this._navigator.stateService.currentState$
            .map((frame: IFrame): IVNodeHash => {
                let node: Node = frame.state.currentNode;

                let camera: Camera = frame.state.camera;
                let lookat: THREE.Vector3 = camera.lookat.clone().sub(camera.position);

                let planeRotation: number = Math.atan2(lookat.y, lookat.x);
                let upRotation: number = this.spatial.angleToPlane(lookat.toArray(), [0, 0, 1]);

                if (node == null ||
                    (node.key === this.currentKey &&
                    Math.abs(this.currentPlaneRotation - planeRotation) < this.rotationEpsilon &&
                    Math.abs(this.currentUpRotation - upRotation) < this.rotationEpsilon)) {
                    return null;
                }

                this.currentKey = node.key;
                this.currentPlaneRotation = planeRotation;
                this.currentUpRotation = upRotation;

                let phi: number = this.rotationFromCamera(frame.state.camera).phi;

                let btns: vd.VNode[] = [];
                let turns: vd.VNode[] = [];
                if (node.pano) {
                    btns = btns.concat(this.createPanoArrows(node, phi));
                } else {
                    btns = btns.concat(this.createPerspectiveToPanoArrows(node, phi));
                    btns = btns.concat(this.createStepArrows(node, phi));
                    turns = turns.concat(this.createTurnArrows(node));
                }

                let sequence: vd.VNode[] = this.createSequenceArrows(node);

                return {name: this._name, vnode: this.getVNodeContainer(btns, turns, sequence, phi, node.pano)};
            })
            .filter((hash: IVNodeHash): boolean => { return hash != null; })
            .subscribe(this._container.domRenderer.render$);
    }

    protected _deactivate(): void {
        this._disposable.dispose();
    }

    private createStepArrows(node: Node, phi: number): Array<vd.VNode> {
        let btns: Array<vd.VNode> = [];

        for (let edge of node.edges) {
            let direction: EdgeDirection = edge.data.direction;
            if (this.steps.indexOf(direction) === -1) {
                continue;
            }

            btns.push(this.createVNodeByDirection(edge.data.worldMotionAzimuth, phi, direction));
        }

        return btns;
    }

    private createPerspectiveToPanoArrows(node: Node, phi: number): Array<vd.VNode> {
        let btns: Array<vd.VNode> = [];

        for (let edge of node.edges) {
            if (edge.data.direction !== EdgeDirection.PANO) {
                continue;
            }

            btns.push(this.createVNodeByKey(edge.data.worldMotionAzimuth, phi, this.innerArrowOffset, edge.to, "DirectionsArrowPano"));
        }

        return btns;
    }

    private createPanoArrows(node: Node, phi: number): Array<vd.VNode> {
        let btns: Array<vd.VNode> = [];

        for (let edge of node.edges) {
            let direction: EdgeDirection = edge.data.direction;

            if (direction === EdgeDirection.PANO) {
                btns.push(this.createVNodeByKey(edge.data.worldMotionAzimuth, phi, this.arrowOffset, edge.to, "DirectionsArrowPano"));
            } else if (this.steps.indexOf(direction) > -1) {
                btns.push(this.createPanoToPerspectiveArrow(edge.data.worldMotionAzimuth, phi, direction, edge.to));
            }
        }

        return btns;
    }

    private createTurnArrows(node: Node): Array<vd.VNode> {
        let turns: Array<vd.VNode> = [];

        for (let edge of node.edges) {
            let direction: EdgeDirection = edge.data.direction;
            let name: string = this.turnNames[direction];

            if (this.turns.indexOf(direction) === -1) {
                continue;
            }

            let style: any = {};

            if (name === "TurnRight") {
                style.transform = "perspective(375px) rotateX(60deg) scaleX(-1)";
            } else if (name === "TurnLeft") {
                style.transform = "perspective(375px) rotateX(60deg)";
            } else if (name === "TurnAround") {
                style.transform = "perspective(375px) rotateX(60deg) rotate(270deg) scale(1.15, 1.15)";
            }

            turns.push(this.createVNodeByTurn(name, direction, style));
        }

        return turns;
    }

    private createPanoToPerspectiveArrow(azimuth: number, phi: number, direction: EdgeDirection, key: string): vd.VNode {
        let threshold: number = Math.PI / 8;

        let rotation: number = phi;

        switch (direction) {
            case EdgeDirection.STEP_BACKWARD:
                rotation = phi - Math.PI;
                break;
            case EdgeDirection.STEP_LEFT:
                rotation = phi + Math.PI / 2;
                break;
            case EdgeDirection.STEP_RIGHT:
                rotation = phi - Math.PI / 2;
                break;
            default:
                break;
        }

        if (Math.abs(this.spatial.wrapAngle(azimuth - rotation)) < threshold) {
            return this.createVNodeByKey(azimuth, phi, this.arrowOffset, key, "DirectionsArrowStep");
        }

        return this.createVNodeDisabled(azimuth, phi);
    }

    private createSequenceArrows(node: Node): vd.VNode[] {
        let nextExist: boolean = false;
        let prevExist: boolean = false;

        for (let edge of node.edges) {
            if (edge.data.direction === EdgeDirection.NEXT) {
                nextExist = true;
            }

            if (edge.data.direction === EdgeDirection.PREV) {
                prevExist = true;
            }
        }

        let next: string = "div.NextInSeq" + (nextExist ? "" : ".InSeqDisabled");
        let prev: string = "div.PrevInSeq" + (prevExist ? "" : ".InSeqDisabled");

        return [
            vd.h(next, { onclick: (e: Event): void => { this._navigator.moveDir(EdgeDirection.NEXT).subscribe(); } }, []),
            vd.h(prev, { onclick: (e: Event): void => { this._navigator.moveDir(EdgeDirection.PREV).subscribe(); } }, []),
        ];
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

    private createVNodeByKey(azimuth: number, phi: number, offset: number, key: string, className: string): vd.VNode {
        let onClick: (e: Event) => void =
            (e: Event): void => { this._navigator.moveToKey(key).subscribe(); };

        return this.createVNode(azimuth, phi, offset, className, onClick);
    }

    private createVNodeDisabled(azimuth: number, phi: number): vd.VNode {
        return this.createVNode(azimuth, phi, this.arrowOffset, "DirectionsArrowDisabled");
    }

    private createVNodeByDirection(azimuth: number, phi: number, direction: EdgeDirection): vd.VNode {
        let onClick: (e: Event) => void =
            (e: Event): void => { this._navigator.moveDir(direction).subscribe(); };

        return this.createVNode(azimuth, phi, this.arrowOffset, "DirectionsArrowStep", onClick);
    }

    private createVNodeByTurn(name: string, direction: EdgeDirection, style: any): vd.VNode {
        let onClick: (e: Event) => void =
            (e: Event): void => { this._navigator.moveDir(direction).subscribe(); };

        return vd.h(`div.${name}`,
                    {onclick: onClick,
                     style,
                    },
                    []);
    }

    private createVNode(azimuth: number, phi: number, offset: number, className: string, onClick?: (e: Event) => void): vd.VNode {
        let translation: Array<number> = this.calcTranslation(azimuth);

        // rotate 90 degrees clockwise and flip over X-axis
        let translationX: number = -offset * translation[1];
        let translationY: number = -offset * translation[0];

        let shadowTranslation: Array<number> = this.calcShadowTranslation(azimuth, phi);
        let shadowTranslationX: number = -this.dropShadowOffset * shadowTranslation[1];
        let shadowTranslationY: number = this.dropShadowOffset * shadowTranslation[0];

        let azimuthDeg: number = -this.spatial.radToDeg(azimuth);

        let filter: string = `drop-shadow(${shadowTranslationX}px ${shadowTranslationY}px 1px rgba(0,0,0,0.8))`;
        let transform: string = `translate(${translationX}px, ${translationY}px) rotate(${azimuthDeg}deg)`;

        let properties: any = {
            style: {
                    "-webkit-filter": filter,
                    filter: filter,
                    transform: transform,
            },
        };

        if (onClick != null) {
            properties.onclick = onClick;
        }

        return vd.h("div." + className, properties, []);
    }

    private getVNodePanoIndication(panorama: boolean): vd.VNode {
        if (panorama) {
            return vd.h("div.PanoIndication", {}, []);
        } else {
            return undefined;
        }
    }

    private getVNodeContainer(
        buttons: vd.VNode[],
        turns: vd.VNode[],
        sequence: vd.VNode[],
        rotateZ: number,
        pano: boolean): any {

        let rotateZDeg: number = 180 * rotateZ / Math.PI;

        // todo: change the rotateX value for panoramas
        let style: any = {
            transform: `perspective(375px) rotateX(60deg) rotateZ(${rotateZDeg}deg)`
        };

        return vd.h("div", {},
                    [vd.h("div.InSeq", {}, sequence),
                     this.getVNodePanoIndication(pano),
                     vd.h("div.DirectionsWrapper", {}, [
                         turns,
                         vd.h("div.Directions", {style: style}, buttons),
                     ]),
                    ]);
    }
}

UIService.register(DirectionsUI);
export default DirectionsUI;
