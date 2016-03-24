/// <reference path="../../typings/browser.d.ts" />

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

    private _spatial: Spatial;

    private _disposable: rx.IDisposable;

    private _arrowOffset: number;
    private _innerArrowOffset: number;
    private _dropShadowOffset: number;

    private _currentKey: string;
    private _currentPlaneRotation: number;
    private _currentUpRotation: number;
    private _rotationEpsilon: number;

    private _steps: Array<EdgeDirection>;
    private _turns: Array<EdgeDirection>;
    private _turnNames: {[dir: number]: string};

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);

        // cssOffset is a magic number in px
        this._arrowOffset = 62;
        this._innerArrowOffset = 25;
        this._dropShadowOffset = 3;

        this._steps = [
            EdgeDirection.StepForward,
            EdgeDirection.StepBackward,
            EdgeDirection.StepLeft,
            EdgeDirection.StepRight,
        ];

        this._turns = [
            EdgeDirection.TurnLeft,
            EdgeDirection.TurnRight,
            EdgeDirection.TurnU,
        ];

        this._turnNames = {};
        this._turnNames[EdgeDirection.TurnLeft] = "TurnLeft";
        this._turnNames[EdgeDirection.TurnRight] = "TurnRight";
        this._turnNames[EdgeDirection.TurnU] = "TurnAround";

    }

    protected _activate(): void {
        this._spatial = new Spatial();

        this._currentKey = null;
        this._currentPlaneRotation = 0;
        this._currentUpRotation = 0;
        this._rotationEpsilon = 0.5 * Math.PI / 180;

        this._disposable = this._navigator.stateService.currentState$
            .map((frame: IFrame): IVNodeHash => {
                let node: Node = frame.state.currentNode;

                let camera: Camera = frame.state.camera;
                let lookat: THREE.Vector3 = camera.lookat.clone().sub(camera.position);

                let planeRotation: number = Math.atan2(lookat.y, lookat.x);
                let upRotation: number = this._spatial.angleToPlane(lookat.toArray(), [0, 0, 1]);

                if (node == null ||
                    (node.key === this._currentKey &&
                    Math.abs(this._currentPlaneRotation - planeRotation) < this._rotationEpsilon &&
                    Math.abs(this._currentUpRotation - upRotation) < this._rotationEpsilon)) {
                    return null;
                }

                this._currentKey = node.key;
                this._currentPlaneRotation = planeRotation;
                this._currentUpRotation = upRotation;

                let rotation: IRotation = this._rotationFromCamera(frame.state.camera);

                let x: number = 15 * Math.PI / 32 - rotation.theta;
                let opacity: number = Math.min(0.8, Math.max(0.6, -1.8 * x / Math.PI + 0.8));

                let btns: vd.VNode[] = [];
                let turns: vd.VNode[] = [];

                if (node.pano) {
                    btns = btns.concat(this._createPanoArrows(node, rotation, opacity));
                } else {
                    btns = btns.concat(this._createPerspectiveToPanoArrows(node, rotation, opacity));
                    btns = btns.concat(this._createStepArrows(node, rotation, opacity));
                    turns = turns.concat(this._createTurnArrows(node));
                }

                return {name: this._name, vnode: this._getVNodeContainer(btns, turns, rotation, node.pano)};
            })
            .filter((hash: IVNodeHash): boolean => { return hash != null; })
            .subscribe(this._container.domRenderer.render$);
    }

    protected _deactivate(): void {
        this._disposable.dispose();
    }

    private _createStepArrows(node: Node, rotation: IRotation, opacity: number): Array<vd.VNode> {
        let btns: Array<vd.VNode> = [];

        for (let edge of node.edges) {
            let direction: EdgeDirection = edge.data.direction;
            if (this._steps.indexOf(direction) === -1) {
                continue;
            }

            btns.push(this._createVNodeByDirection(edge.data.worldMotionAzimuth, rotation, opacity, direction));
        }

        return btns;
    }

    private _createPerspectiveToPanoArrows(node: Node, rotation: IRotation, opacity: number): Array<vd.VNode> {
        let btns: Array<vd.VNode> = [];

        for (let edge of node.edges) {
            if (edge.data.direction !== EdgeDirection.Pano) {
                continue;
            }

            btns.push(
                this._createVNodeByKey(
                    edge.data.worldMotionAzimuth,
                    rotation,
                    opacity,
                    this._innerArrowOffset,
                    edge.to,
                    "DirectionsArrowPano"));
        }

        return btns;
    }

    private _createPanoArrows(node: Node, rotation: IRotation, opacity: number): Array<vd.VNode> {
        let btns: Array<vd.VNode> = [];

        for (let edge of node.edges) {
            let direction: EdgeDirection = edge.data.direction;

            if (direction === EdgeDirection.Pano) {
                btns.push(
                    this._createVNodeByKey(
                        edge.data.worldMotionAzimuth,
                        rotation,
                        opacity,
                        this._arrowOffset,
                        edge.to,
                        "DirectionsArrowPano"));
            } else if (this._steps.indexOf(direction) > -1) {
                btns.push(
                    this._createPanoToPerspectiveArrow(
                        edge.data.worldMotionAzimuth,
                        rotation,
                        opacity,
                        direction,
                        edge.to));
            }
        }

        return btns;
    }

    private _createTurnArrows(node: Node): Array<vd.VNode> {
        let turns: Array<vd.VNode> = [];

        for (let edge of node.edges) {
            let direction: EdgeDirection = edge.data.direction;
            let name: string = this._turnNames[direction];

            if (this._turns.indexOf(direction) === -1) {
                continue;
            }

            turns.push(this._createVNodeByTurn(name, direction));
        }

        return turns;
    }

    private _createPanoToPerspectiveArrow(
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

        if (Math.abs(this._spatial.wrapAngle(azimuth - relativePhi)) < threshold) {
            return this._createVNodeByKey(
                azimuth,
                rotation,
                opacity,
                this._arrowOffset,
                key,
                "DirectionsArrowStep");
        }

        return this._createVNodeDisabled(azimuth, rotation);
    }

    private _rotationFromCamera(camera: Camera): IRotation {
        let direction: THREE.Vector3 = camera.lookat.clone().sub(camera.position);

        let upProjection: number = direction.clone().dot(camera.up);
        let planeProjection: THREE.Vector3 = direction.clone().sub(camera.up.clone().multiplyScalar(upProjection));

        let phi: number = Math.atan2(planeProjection.y, planeProjection.x);
        let theta: number = Math.PI / 2 - this._spatial.angleToPlane(direction.toArray(), [0, 0, 1]);

        return { phi: phi, theta: theta };
    }

    private _calcTranslation(angle: number): Array<number> {
        return [Math.cos(angle), Math.sin(angle)];
    }

    private _calcShadowTranslation(azimuth: number, phi: number): Array<number> {
        let angle: number = this._spatial.wrapAngle(azimuth - phi);

        return this._calcTranslation(angle);
    }

    private _createVNodeByKey(
        azimuth: number,
        rotation: IRotation,
        opacity: number,
        offset: number,
        key: string,
        className: string): vd.VNode {

        let onClick: (e: Event) => void =
            (e: Event): void => { this._navigator.moveToKey(key).subscribe(); };

        return this._createVNode(azimuth, rotation, opacity, offset, className, onClick);
    }

    private _createVNodeDisabled(azimuth: number, rotation: IRotation): vd.VNode {
        return this._createVNode(azimuth, rotation, 0.2 , this._arrowOffset, "DirectionsArrowDisabled");
    }

    private _createVNodeByDirection(azimuth: number, rotation: IRotation, opacity: number, direction: EdgeDirection): vd.VNode {
        let onClick: (e: Event) => void =
            (e: Event): void => { this._navigator.moveDir(direction).subscribe(); };

        return this._createVNode(azimuth, rotation, opacity, this._arrowOffset, "DirectionsArrowStep", onClick);
    }

    private _createVNodeByTurn(name: string, direction: EdgeDirection): vd.VNode {
        let onClick: (e: Event) => void =
            (e: Event): void => { this._navigator.moveDir(direction).subscribe(); };

        return vd.h(`div.${name}`, { onclick: onClick }, []);
    }

    private _createVNode(
        azimuth: number,
        rotation: IRotation,
        opacity: number,
        offset: number,
        className: string,
        onClick?: (e: Event) => void): vd.VNode {

        let translation: Array<number> = this._calcTranslation(azimuth);

        // rotate 90 degrees clockwise and flip over X-axis
        let translationX: number = -offset * translation[1];
        let translationY: number = -offset * translation[0];

        let shadowTranslation: Array<number> = this._calcShadowTranslation(azimuth, rotation.phi);
        let shadowTranslationX: number = -this._dropShadowOffset * shadowTranslation[1];
        let shadowTranslationY: number = this._dropShadowOffset * shadowTranslation[0];

        let azimuthDeg: number = -this._spatial.radToDeg(azimuth);

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

    private _getVNodePanoIndication(panorama: boolean): vd.VNode {
        if (panorama) {
            return vd.h("div.PanoIndication", {}, []);
        } else {
            return undefined;
        }
    }

    private _getVNodeContainer(
        buttons: vd.VNode[],
        turns: vd.VNode[],
        rotation: IRotation,
        pano: boolean): any {

        let rotateZ: number = this._spatial.radToDeg(rotation.phi);

        // todo: change the rotateX value for panoramas
        let style: any = {
            transform: `perspective(375px) rotateX(60deg) rotateZ(${rotateZ}deg)`,
        };

        return vd.h("div", {},
                    [this._getVNodePanoIndication(pano),
                     vd.h("div.DirectionsWrapper", {}, [
                         turns,
                         vd.h("div.Directions", {style: style}, buttons),
                     ]),
                    ]);
    }
}

ComponentService.register(DirectionComponent);
export default DirectionComponent;
