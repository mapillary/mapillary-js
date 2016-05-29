/// <reference path="../../../typings/browser.d.ts" />

import * as THREE from "three";
import * as vd from "virtual-dom";

import {IDirectionConfiguration} from "../../Component";
import {EdgeDirection, IEdge} from "../../Edge";
import {Camera, Spatial} from "../../Geo";
import {Node} from "../../Graph";
import {RenderCamera} from "../../Render";
import {IRotation} from "../../State";
import {Navigator} from "../../Viewer";

export class DirectionDOMRenderer {
    private _node: Node;

    private _rotation: IRotation;
    private _epsilon: number;

    private _spatial: Spatial;

    private _arrowOffset: number;
    private _innerArrowOffset: number;
    private _dropShadowOffset: number;

    private _offsetScale: number;
    private _highlightKey: string;

    private _needsRender: boolean;

    private _stepEdges: IEdge[];
    private _turnEdges: IEdge[];
    private _panoEdges: IEdge[];
    private _sequenceEdgeKeys: string[];

    private _stepDirections: EdgeDirection[];
    private _turnDirections: EdgeDirection[];
    private _turnNames: {[dir: number]: string};

    constructor() {
        this._node = null;

        this._rotation = { phi: 0, theta: 0 };
        this._epsilon = 0.5 * Math.PI / 180;

        this._spatial = new Spatial();

        this._arrowOffset = 62;
        this._innerArrowOffset = 25;
        this._dropShadowOffset = 3;

        this._offsetScale = 1;
        this._highlightKey = null;

        this._needsRender = false;

        this._stepEdges = [];
        this._turnEdges = [];
        this._panoEdges = [];
        this._sequenceEdgeKeys = [];

        this._stepDirections = [
            EdgeDirection.StepForward,
            EdgeDirection.StepBackward,
            EdgeDirection.StepLeft,
            EdgeDirection.StepRight,
        ];

        this._turnDirections = [
            EdgeDirection.TurnLeft,
            EdgeDirection.TurnRight,
            EdgeDirection.TurnU,
        ];

        this._turnNames = {};
        this._turnNames[EdgeDirection.TurnLeft] = "TurnLeft";
        this._turnNames[EdgeDirection.TurnRight] = "TurnRight";
        this._turnNames[EdgeDirection.TurnU] = "TurnAround";
    }

    public get needsRender(): boolean {
        return this._needsRender;
    }

    public render(navigator: Navigator): vd.VNode {
        this._needsRender = false;

        let rotation: IRotation = this._rotation;

        let steps: vd.VNode[] = [];
        let turns: vd.VNode[] = [];

        if (this._node.pano) {
            steps = steps.concat(this._createPanoArrows(navigator, rotation));
        } else {
            steps = steps.concat(this._createPerspectiveToPanoArrows(navigator, rotation));
            steps = steps.concat(this._createStepArrows(navigator, rotation));
            turns = turns.concat(this._createTurnArrows(navigator));
        }

        return this._getContainer(steps, turns, rotation, this._node.pano);
    }

    public setNode(node: Node): void {
        this._node = node;
        this._setEdges(node);

        this._needsRender = true;
    }

    public setRenderCamera(renderCamera: RenderCamera): void {
        let camera: Camera = renderCamera.camera;

        let direction: THREE.Vector3 = this._directionFromCamera(camera);
        let rotation: IRotation = this._getRotation(direction, camera.up);

        if (Math.abs(rotation.phi - this._rotation.phi) < this._epsilon) {
            return;
        }

        this._rotation = rotation;

        if (this._node != null) {
            this._needsRender = true;
        }
    }

    public setConfiguration(configuration: IDirectionConfiguration): void {
        if (this._offsetScale === configuration.offsetScale &&
            this._highlightKey === configuration.highlightKey) {
                return;
            }

        this._offsetScale = Math.max(1, configuration.offsetScale);
        this._highlightKey = configuration.highlightKey;

        if (this._node != null) {
            this._needsRender = true;
        }
    }

    private _setEdges(node: Node): void {
        this._stepEdges = [];
        this._turnEdges = [];
        this._panoEdges = [];
        this._sequenceEdgeKeys = [];

        for (let edge of node.edges) {
            let direction: EdgeDirection = edge.data.direction;

            if (this._stepDirections.indexOf(direction) > -1) {
                this._stepEdges.push(edge);
                continue;
            }

            if (this._turnDirections.indexOf(direction) > -1) {
                this._turnEdges.push(edge);
                continue;
            }

            if (edge.data.direction === EdgeDirection.Pano) {
                this._panoEdges.push(edge);
            }
        }

        let edges: IEdge[] = this._panoEdges
            .concat(this._stepEdges)
            .concat(this._turnEdges);

        for (let edge of edges) {
            let edgeKey: string = edge.to;

            for (let sequenceKey of this._node.sequence.keys) {
                if (sequenceKey === edgeKey) {
                    this._sequenceEdgeKeys.push(edgeKey);
                    break;
                }
            }
        }
    }

    private _directionFromCamera(camera: Camera): THREE.Vector3 {
        return camera.lookat.clone().sub(camera.position);
    }

    private _getRotation(direction: THREE.Vector3, up: THREE.Vector3): IRotation {
       let upProjection: number = direction.clone().dot(up);
       let planeProjection: THREE.Vector3 = direction.clone().sub(up.clone().multiplyScalar(upProjection));

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

    private _createPanoArrows(navigator: Navigator, rotation: IRotation): Array<vd.VNode> {
        let arrows: Array<vd.VNode> = [];

        for (let panoEdge of this._panoEdges) {
            arrows.push(
                this._createVNodeByKey(
                    navigator,
                    panoEdge.to,
                    panoEdge.data.worldMotionAzimuth,
                    rotation,
                    this._arrowOffset,
                    "DirectionsArrowPano"));
        }

        for (let stepEdge of this._stepEdges) {
            arrows.push(
                this._createPanoToPerspectiveArrow(
                    navigator,
                    stepEdge.to,
                    stepEdge.data.worldMotionAzimuth,
                    rotation,
                    stepEdge.data.direction));
        }

        return arrows;
    }

    private _createPanoToPerspectiveArrow(
        navigator: Navigator,
        key: string,
        azimuth: number,
        rotation: IRotation,
        direction: EdgeDirection): vd.VNode {

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
                navigator,
                key,
                azimuth,
                rotation,
                this._arrowOffset,
                "DirectionsArrowStep");
        }

        return this._createVNodeDisabled(key, azimuth, rotation);
    }

    private _createPerspectiveToPanoArrows(navigator: Navigator, rotation: IRotation): Array<vd.VNode> {
        let arrows: Array<vd.VNode> = [];

        for (let panoEdge of this._panoEdges) {
            arrows.push(
                this._createVNodeByKey(
                    navigator,
                    panoEdge.to,
                    panoEdge.data.worldMotionAzimuth,
                    rotation,
                    this._innerArrowOffset,
                    "DirectionsArrowPano"));
        }

        return arrows;
    }

    private _createStepArrows(navigator: Navigator, rotation: IRotation): Array<vd.VNode> {
        let arrows: Array<vd.VNode> = [];

        for (let stepEdge of this._stepEdges) {
            arrows.push(
                this._createVNodeByDirection(
                    navigator,
                    stepEdge.to,
                    stepEdge.data.worldMotionAzimuth,
                    rotation,
                    stepEdge.data.direction));
        }

        return arrows;
    }


    private _createTurnArrows(navigator: Navigator): Array<vd.VNode> {
        let turns: Array<vd.VNode> = [];

        for (let turnEdge of this._turnEdges) {
            let direction: EdgeDirection = turnEdge.data.direction;
            let name: string = this._turnNames[direction];

            turns.push(
                this._createVNodeByTurn(
                    navigator,
                    turnEdge.to,
                    name,
                    direction));
        }

        return turns;
    }

    private _createVNodeByKey(
        navigator: Navigator,
        key: string,
        azimuth: number,
        rotation: IRotation,
        offset: number,
        className: string): vd.VNode {

        let onClick: (e: Event) => void =
            (e: Event): void => { navigator.moveToKey(key).subscribe(); };

        return this._createVNode(
            key,
            azimuth,
            rotation,
            offset,
            className,
            "DirectionsCircle",
            onClick);
    }

    private _createVNodeByDirection(
        navigator: Navigator,
        key: string,
        azimuth: number,
        rotation: IRotation,
        direction: EdgeDirection): vd.VNode {

        let onClick: (e: Event) => void =
            (e: Event): void => { navigator.moveDir(direction).subscribe(); };

        return this._createVNode(
            key,
            azimuth,
            rotation,
            this._arrowOffset,
            "DirectionsArrowStep",
            "DirectionsCircle",
            onClick);
    }

    private _createVNodeByTurn(
        navigator: Navigator,
        key: string,
        className: string,
        direction: EdgeDirection): vd.VNode {

        let onClick: (e: Event) => void =
            (e: Event): void => { navigator.moveDir(direction).subscribe(); };

        let style: any = {};

        switch (direction) {
            case EdgeDirection.TurnLeft:
                style.left = "0";
                style.top = "5px";
                break;
            case EdgeDirection.TurnRight:
                style.right = "0";
                style.top = "5px";
                break;
            case EdgeDirection.TurnU:
                style.left = "0";
                style.bottom = "5px";
                break;
            default:
                break;
        }

        let circleProperties: vd.createProperties = {
            attributes: {
                "data-key": key,
            },
            onclick: onClick,
            style: style,
        };

        let turn: vd.VNode = vd.h(`div.${className}`, {}, []);

        let circleClassName: string = "TurnCircle";

        if (this._sequenceEdgeKeys.indexOf(key) > -1) {
            circleClassName += "Sequence";
        }

        if (this._highlightKey === key) {
            circleClassName += "Highlight";
        }

        return vd.h("div." + circleClassName, circleProperties, [turn]);
    }

    private _createVNodeDisabled(key: string, azimuth: number, rotation: IRotation): vd.VNode {
        return this._createVNode(
            key,
            azimuth,
            rotation,
            this._arrowOffset,
            "DirectionsArrowDisabled",
            "DirectionsCircleDisabled");
    }

    private _createVNode(
        key: string,
        azimuth: number,
        rotation: IRotation,
        offset: number,
        className: string,
        circleClassName: string,
        onClick?: (e: Event) => void): vd.VNode {

        let translation: Array<number> = this._calcTranslation(azimuth);

        // rotate 90 degrees clockwise and flip over X-axis
        let translationX: number = -this._offsetScale * offset * translation[1];
        let translationY: number = -this._offsetScale * offset * translation[0];

        // chevron is created from top and right border, i.e. shifted 45 degrees
        let azimuthShifted: number = azimuth + Math.PI / 4;

        let shadowTranslation: Array<number> = this._calcShadowTranslation(azimuthShifted, rotation.phi);
        let shadowTranslationX: number = -this._offsetScale * this._dropShadowOffset * shadowTranslation[1];
        let shadowTranslationY: number = this._offsetScale * this._dropShadowOffset * shadowTranslation[0];

        let filter: string = `drop-shadow(${shadowTranslationX}px ${shadowTranslationY}px 1px rgba(0,0,0,0.8))`;

        let properties: vd.createProperties = {
            style: {
                "-webkit-filter": filter,
                filter: filter,
            },
        };

        let chevron: vd.VNode = vd.h("div." + className, properties, []);

        let azimuthShiftedDeg: number = -this._spatial.radToDeg(azimuthShifted);

        let circleTransform: string = `translate(${translationX}px, ${translationY}px) rotate(${azimuthShiftedDeg}deg)`;
        let circleProperties: vd.createProperties = {
            attributes: { "data-key": key },
            onclick: onClick,
            style: { transform: circleTransform },
        };

        if (this._sequenceEdgeKeys.indexOf(key) > -1) {
            circleClassName += "Sequence";
        }

        if (this._highlightKey === key) {
            circleClassName += "Highlight";
        }

        return vd.h("div." + circleClassName, circleProperties, [chevron]);
    }

    private _getVNodePanoIndication(panorama: boolean): vd.VNode {
        if (panorama) {
            return vd.h("div.PanoIndication", {}, []);
        } else {
            return undefined;
        }
    }

    private _getContainer(
        steps: vd.VNode[],
        turns: vd.VNode[],
        rotation: IRotation,
        pano: boolean): any {

        let rotateZ: number = this._spatial.radToDeg(rotation.phi);

        let perspectiveStyle: any = {
            transform: `perspective(325px) rotateX(60deg)`,
        };

        let style: any = {
            transform: `rotateZ(${rotateZ}deg)`,
        };

        return vd.h("div", {}, [
                this._getVNodePanoIndication(pano),
                vd.h("div.DirectionsWrapper", {}, [
                    vd.h("div.DirectionsPerspective", { style: perspectiveStyle }, [
                        turns,
                        vd.h("div.Directions", { style: style }, steps),
                    ]),
                ]),
            ]);
    }
}

export default DirectionDOMRenderer;
