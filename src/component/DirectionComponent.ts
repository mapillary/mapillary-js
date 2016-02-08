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

import {ComponentService, Component} from "../Component";
import {IVNodeHash} from "../Render";

export class DirectionComponent extends Component {
    public static componentName: string = "direction";

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
            EdgeDirection.StepForward,
            EdgeDirection.StepBackward,
            EdgeDirection.StepLeft,
            EdgeDirection.StepRight,
        ];

        this.turns = [
            EdgeDirection.TurnLeft,
            EdgeDirection.TurnRight,
            EdgeDirection.TurnU,
        ];

        this.turnNames = {};
        this.turnNames[EdgeDirection.TurnLeft] = "TurnLeft";
        this.turnNames[EdgeDirection.TurnRight] = "TurnRight";
        this.turnNames[EdgeDirection.TurnU] = "TurnAround";

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

                let rotation: IRotation = this.rotationFromCamera(frame.state.camera);

                let x: number = 15 * Math.PI / 32 - rotation.theta;
                let opacity: number = Math.min(0.8, Math.max(0.6, -1.8 * x / Math.PI + 0.8));

                let btns: vd.VNode[] = [];
                let turns: vd.VNode[] = [];

                if (node.pano) {
                    btns = btns.concat(this.createPanoArrows(node, rotation, opacity));
                } else {
                    btns = btns.concat(this.createPerspectiveToPanoArrows(node, rotation, opacity));
                    btns = btns.concat(this.createStepArrows(node, rotation, opacity));
                    turns = turns.concat(this.createTurnArrows(node));
                }

                let sequence: vd.VNode[] = this.createSequenceArrows(node);

                return {name: this._name, vnode: this.getVNodeContainer(btns, turns, sequence, rotation, node.pano)};
            })
            .filter((hash: IVNodeHash): boolean => { return hash != null; })
            .subscribe(this._container.domRenderer.render$);
    }

    protected _deactivate(): void {
        this._disposable.dispose();
    }

    private createStepArrows(node: Node, rotation: IRotation, opacity: number): Array<vd.VNode> {
        let btns: Array<vd.VNode> = [];

        for (let edge of node.edges) {
            let direction: EdgeDirection = edge.data.direction;
            if (this.steps.indexOf(direction) === -1) {
                continue;
            }

            btns.push(this.createVNodeByDirection(edge.data.worldMotionAzimuth, rotation, opacity, direction));
        }

        return btns;
    }

    private createPerspectiveToPanoArrows(node: Node, rotation: IRotation, opacity: number): Array<vd.VNode> {
        let btns: Array<vd.VNode> = [];

        for (let edge of node.edges) {
            if (edge.data.direction !== EdgeDirection.Pano) {
                continue;
            }

            btns.push(
                this.createVNodeByKey(
                    edge.data.worldMotionAzimuth,
                    rotation,
                    opacity,
                    this.innerArrowOffset,
                    edge.to,
                    "DirectionsArrowPano"));
        }

        return btns;
    }

    private createPanoArrows(node: Node, rotation: IRotation, opacity: number): Array<vd.VNode> {
        let btns: Array<vd.VNode> = [];

        for (let edge of node.edges) {
            let direction: EdgeDirection = edge.data.direction;

            if (direction === EdgeDirection.Pano) {
                btns.push(
                    this.createVNodeByKey(
                        edge.data.worldMotionAzimuth,
                        rotation,
                        opacity,
                        this.arrowOffset,
                        edge.to,
                        "DirectionsArrowPano"));
            } else if (this.steps.indexOf(direction) > -1) {
                btns.push(
                    this.createPanoToPerspectiveArrow(
                        edge.data.worldMotionAzimuth,
                        rotation,
                        opacity,
                        direction,
                        edge.to));
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

    private createPanoToPerspectiveArrow(
        azimuth: number,
        rotation: IRotation,
        opacity: number,
        direction: EdgeDirection,
        key: string): vd.VNode {

        let threshold: number = Math.PI / 8;

        let relativePhi: number = rotation.phi;

        switch (direction) {
            case EdgeDirection.StepBackward:
                relativePhi = rotation.phi - Math.PI;
                break;
            case EdgeDirection.StepLeft:
                relativePhi = rotation.phi + Math.PI / 2;
                break;
            case EdgeDirection.StepRight:
                relativePhi = rotation.phi - Math.PI / 2;
                break;
            default:
                break;
        }

        if (Math.abs(this.spatial.wrapAngle(azimuth - relativePhi)) < threshold) {
            return this.createVNodeByKey(
                azimuth,
                rotation,
                opacity,
                this.arrowOffset,
                key,
                "DirectionsArrowStep");
        }

        return this.createVNodeDisabled(azimuth, rotation, opacity);
    }

    private createSequenceArrows(node: Node): vd.VNode[] {
        let nextExist: boolean = false;
        let prevExist: boolean = false;

        for (let edge of node.edges) {
            if (edge.data.direction === EdgeDirection.Next) {
                nextExist = true;
            }

            if (edge.data.direction === EdgeDirection.Prev) {
                prevExist = true;
            }
        }

        let next: string = "div.NextInSeq" + (nextExist ? "" : ".InSeqDisabled");
        let prev: string = "div.PrevInSeq" + (prevExist ? "" : ".InSeqDisabled");

        return [
            vd.h(next, { onclick: (e: Event): void => { this._navigator.moveDir(EdgeDirection.Next).subscribe(); } }, []),
            vd.h(prev, { onclick: (e: Event): void => { this._navigator.moveDir(EdgeDirection.Prev).subscribe(); } }, []),
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

    private createVNodeByKey(
        azimuth: number,
        rotation: IRotation,
        opacity: number,
        offset: number,
        key: string,
        className: string): vd.VNode {

        let onClick: (e: Event) => void =
            (e: Event): void => { this._navigator.moveToKey(key).subscribe(); };

        return this.createVNode(azimuth, rotation, opacity, offset, className, onClick);
    }

    private createVNodeDisabled(azimuth: number, rotation: IRotation, opacity: number): vd.VNode {
        return this.createVNode(azimuth, rotation, opacity , this.arrowOffset, "DirectionsArrowDisabled");
    }

    private createVNodeByDirection(azimuth: number, rotation: IRotation, opacity: number, direction: EdgeDirection): vd.VNode {
        let onClick: (e: Event) => void =
            (e: Event): void => { this._navigator.moveDir(direction).subscribe(); };

        return this.createVNode(azimuth, rotation, opacity, this.arrowOffset, "DirectionsArrowStep", onClick);
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

    private createVNode(
        azimuth: number,
        rotation: IRotation,
        opacity: number,
        offset: number,
        className: string,
        onClick?: (e: Event) => void): vd.VNode {

        let translation: Array<number> = this.calcTranslation(azimuth);

        // rotate 90 degrees clockwise and flip over X-axis
        let translationX: number = -offset * translation[1];
        let translationY: number = -offset * translation[0];

        let shadowTranslation: Array<number> = this.calcShadowTranslation(azimuth, rotation.phi);
        let shadowTranslationX: number = -this.dropShadowOffset * shadowTranslation[1];
        let shadowTranslationY: number = this.dropShadowOffset * shadowTranslation[0];

        let azimuthDeg: number = -this.spatial.radToDeg(azimuth);

        let filter: string = `drop-shadow(${shadowTranslationX}px ${shadowTranslationY}px 1px rgba(0,0,0,0.8))`;
        let transform: string = `translate(${translationX}px, ${translationY}px) rotate(${azimuthDeg}deg)`;

        let properties: any = {
            style: {
                    "-webkit-filter": filter,
                    filter: filter,
                    opacity: `${opacity}`,
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
        rotation: IRotation,
        pano: boolean): any {

        let rotateZ: number = this.spatial.radToDeg(rotation.phi);

        // todo: change the rotateX value for panoramas
        let style: any = {
            transform: `perspective(375px) rotateX(60deg) rotateZ(${rotateZ}deg)`
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

ComponentService.register(DirectionComponent);
export default DirectionComponent;
