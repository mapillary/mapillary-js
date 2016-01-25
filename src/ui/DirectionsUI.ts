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

import {UI} from "../UI";
import {IVNodeHash} from "../Render";

interface IRotation {
    phi: number;
    theta: number;
}

export class DirectionsUI extends UI {
    public static uiName: string = "directions";

    private spatial: Spatial;

    private stateSubscription: rx.IDisposable;

    private cssOffset: number;
    private dropShadowOffset: number;

    private currentKey: string;
    private currentDirection: THREE.Vector3;
    private directionEpsilon: number;

    private steps: Array<EdgeDirection>;
    private turns: Array<EdgeDirection>;
    private turnNames: {[dir: number]: string};

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);

        this.spatial = new Spatial();

        this.currentKey = null;
        this.currentDirection = new THREE.Vector3();
        this.directionEpsilon = 0.01;

        // cssOffset is a magic number in px
        this.cssOffset = 62;
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
        ];

        this.turnNames = {};
        this.turnNames[EdgeDirection.TURN_LEFT] = "TurnLeft";
        this.turnNames[EdgeDirection.TURN_RIGHT] = "TurnRight";
    }

    protected _activate(): void {
        this.stateSubscription = this._navigator.stateService.currentState$
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

                let phi: number = this.rotationFromCamera(frame.state.camera).phi;

                let btns: vd.VNode[] = [];
                let turns: vd.VNode[] = [];
                if (node.pano) {
                    btns = btns.concat(this.createPanoArrows(node, phi));
                } else {
                    btns = btns.concat(this.createStepArrows(node, phi));
                    turns = turns.concat(this.createTurnArrows(node));
                }

                return {name: this._name, vnode: this.getVNodeContainer(btns, turns, phi)};
            })
            .filter((hash: IVNodeHash): boolean => { return hash != null; })
            .subscribe(this._container.domRenderer.render$);
    }

    protected _deactivate(): void {
        this._container.domRenderer.clear(this._name);
        this.stateSubscription.dispose();
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

    private createTurnArrows(node: Node): Array<vd.VNode> {
        let turns: Array<vd.VNode> = [];

        for (let edge of node.edges) {
            let direction: EdgeDirection = edge.data.direction;
            let name: string = this.turnNames[direction];

            if (this.turns.indexOf(direction) === -1) {
                continue;
            }

            turns.push(this.createVNodeByTurn(name, direction));
        }

        return turns;
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
            (e: Event): void => { this._navigator.moveToKey(key).first().subscribe(); };

        return this.createVNode(azimuth, phi, onClick);
    }

    private createVNodeByDirection(azimuth: number, phi: number, direction: EdgeDirection): vd.VNode {
        let onClick: (e: Event) => void =
            (e: Event): void => { this._navigator.moveDir(direction).first().subscribe(); };

        return this.createVNode(azimuth, phi, onClick);
    }

    private createVNodeByTurn(name: string, direction: EdgeDirection): vd.VNode {
        let onClick: (e: Event) => void =
            (e: Event): void => { this._navigator.moveDir(direction).first().subscribe(); };

        return vd.h(`div.${name}`,
                    {onclick: onClick},
                    []);
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

    private getVNodeContainer(buttons: any, turns: any, rotateZ: number): any {
        let rotateZDeg: number = 180 * rotateZ / Math.PI;

        // todo: change the rotateX value for panoramas
        let style: any = {
            transform: `perspective(375px) rotateX(60deg) rotateZ(${rotateZDeg}deg)`
        };

        return vd.h("div.DirectionsWrapper", {},
                    [turns,
                     vd.h("div.Directions", {style: style}, buttons),
                    ]);
    }
}

export default DirectionsUI;
