import * as vd from "virtual-dom";
import { CancelMapillaryError } from "../../error/CancelMapillaryError";

import { Spatial } from "../../geo/Spatial";
import { Image } from "../../graph/Image";
import { Navigator } from "../../viewer/Navigator";
import { NavigationDirection } from "../../graph/edge/NavigationDirection";
import { NavigationEdge } from "../../graph/edge/interfaces/NavigationEdge";
import { NavigationEdgeStatus } from "../../graph/interfaces/NavigationEdgeStatus";
import { Sequence } from "../../graph/Sequence";
import { ViewportSize } from "../../render/interfaces/ViewportSize";
import { RenderCamera } from "../../render/RenderCamera";
import { EulerRotation } from "../../state/interfaces/EulerRotation";
import { DirectionConfiguration } from "../interfaces/DirectionConfiguration";
import { DirectionDOMCalculator } from "./DirectionDOMCalculator";
import { isSpherical } from "../../geo/Geo";

/**
 * @class DirectionDOMRenderer
 * @classdesc DOM renderer for direction arrows.
 */
export class DirectionDOMRenderer {
    private _spatial: Spatial;
    private _calculator: DirectionDOMCalculator;

    private _image: Image;

    private _rotation: EulerRotation;
    private _epsilon: number;

    private _highlightKey: string;
    private _distinguishSequence: boolean;

    private _needsRender: boolean;

    private _stepEdges: NavigationEdge[];
    private _turnEdges: NavigationEdge[];
    private _sphericalEdges: NavigationEdge[];
    private _sequenceEdgeKeys: string[];

    private _stepDirections: NavigationDirection[];
    private _turnDirections: NavigationDirection[];
    private _turnNames: { [dir: number]: string };

    private _isEdge: boolean = false;

    constructor(configuration: DirectionConfiguration, size: ViewportSize) {
        this._spatial = new Spatial();
        this._calculator = new DirectionDOMCalculator(configuration, size);

        this._image = null;

        this._rotation = { phi: 0, theta: 0 };
        this._epsilon = 0.5 * Math.PI / 180;

        this._highlightKey = null;
        this._distinguishSequence = false;

        this._needsRender = false;

        this._stepEdges = [];
        this._turnEdges = [];
        this._sphericalEdges = [];
        this._sequenceEdgeKeys = [];

        this._stepDirections = [
            NavigationDirection.StepForward,
            NavigationDirection.StepBackward,
            NavigationDirection.StepLeft,
            NavigationDirection.StepRight,
        ];

        this._turnDirections = [
            NavigationDirection.TurnLeft,
            NavigationDirection.TurnRight,
            NavigationDirection.TurnU,
        ];

        this._turnNames = {};
        this._turnNames[NavigationDirection.TurnLeft] = "mapillary-direction-turn-left";
        this._turnNames[NavigationDirection.TurnRight] = "mapillary-direction-turn-right";
        this._turnNames[NavigationDirection.TurnU] = "mapillary-direction-turn-around";

        // detects IE 8-11, then Edge 20+.
        let isIE: boolean = !!(<any>document).documentMode;
        this._isEdge = !isIE && !!(<any>window).StyleMedia;
    }

    /**
     * Get needs render.
     *
     * @returns {boolean} Value indicating whether render should be called.
     */
    public get needsRender(): boolean {
        return this._needsRender;
    }

    /**
     * Renders virtual DOM elements.
     *
     * @description Calling render resets the needs render property.
     */
    public render(navigator: Navigator): vd.VNode {
        this._needsRender = false;

        let rotation: EulerRotation = this._rotation;

        let steps: vd.VNode[] = [];
        let turns: vd.VNode[] = [];

        if (isSpherical(this._image.cameraType)) {
            steps = steps.concat(this._createSphericalArrows(navigator, rotation));
        } else {
            steps = steps.concat(
                this._createPerspectiveToSphericalArrows(navigator, rotation));
            steps = steps.concat(this._createStepArrows(navigator, rotation));
            turns = turns.concat(this._createTurnArrows(navigator));
        }

        return this._getContainer(steps, turns, rotation);
    }

    public setEdges(edgeStatus: NavigationEdgeStatus, sequence: Sequence): void {
        this._setEdges(edgeStatus, sequence);

        this._setNeedsRender();
    }

    /**
     * Set image for which to show edges.
     *
     * @param {Image} image
     */
    public setImage(image: Image): void {
        this._image = image;
        this._clearEdges();

        this._setNeedsRender();
    }

    /**
     * Set the render camera to use for calculating rotations.
     *
     * @param {RenderCamera} renderCamera
     */
    public setRenderCamera(renderCamera: RenderCamera): void {
        let rotation: EulerRotation = renderCamera.rotation;

        if (Math.abs(rotation.phi - this._rotation.phi) < this._epsilon) {
            return;
        }

        this._rotation = rotation;

        this._setNeedsRender();
    }

    /**
     * Set configuration values.
     *
     * @param {DirectionConfiguration} configuration
     */
    public setConfiguration(configuration: DirectionConfiguration): void {
        let needsRender: boolean = false;
        if (this._highlightKey !== configuration.highlightId ||
            this._distinguishSequence !== configuration.distinguishSequence) {
            this._highlightKey = configuration.highlightId;
            this._distinguishSequence = configuration.distinguishSequence;

            needsRender = true;
        }

        if (this._calculator.minWidth !== configuration.minWidth ||
            this._calculator.maxWidth !== configuration.maxWidth) {
            this._calculator.configure(configuration);
            needsRender = true;
        }

        if (needsRender) {
            this._setNeedsRender();
        }
    }

    /**
     * Detect the element's width and height and resize
     * elements accordingly.
     *
     * @param {ViewportSize} size Size of vßiewer container element.
     */
    public resize(size: ViewportSize): void {
        this._calculator.resize(size);

        this._setNeedsRender();
    }

    private _setNeedsRender(): void {
        if (this._image != null) {
            this._needsRender = true;
        }
    }

    private _clearEdges(): void {
        this._stepEdges = [];
        this._turnEdges = [];
        this._sphericalEdges = [];
        this._sequenceEdgeKeys = [];
    }

    private _setEdges(edgeStatus: NavigationEdgeStatus, sequence: Sequence): void {
        this._stepEdges = [];
        this._turnEdges = [];
        this._sphericalEdges = [];
        this._sequenceEdgeKeys = [];

        for (let edge of edgeStatus.edges) {
            let direction: NavigationDirection = edge.data.direction;

            if (this._stepDirections.indexOf(direction) > -1) {
                this._stepEdges.push(edge);
                continue;
            }

            if (this._turnDirections.indexOf(direction) > -1) {
                this._turnEdges.push(edge);
                continue;
            }

            if (edge.data.direction === NavigationDirection.Spherical) {
                this._sphericalEdges.push(edge);
            }
        }

        if (this._distinguishSequence && sequence != null) {
            let edges: NavigationEdge[] = this._sphericalEdges
                .concat(this._stepEdges)
                .concat(this._turnEdges);

            for (let edge of edges) {
                let edgeKey: string = edge.target;

                for (let sequenceKey of sequence.imageIds) {
                    if (sequenceKey === edgeKey) {
                        this._sequenceEdgeKeys.push(edgeKey);
                        break;
                    }
                }
            }
        }
    }

    private _createSphericalArrows(navigator: Navigator, rotation: EulerRotation): vd.VNode[] {
        let arrows: vd.VNode[] = [];

        for (let sphericalEdge of this._sphericalEdges) {
            arrows.push(
                this._createVNodeByKey(
                    navigator,
                    sphericalEdge.target,
                    sphericalEdge.data.worldMotionAzimuth,
                    rotation,
                    this._calculator.outerRadius,
                    "mapillary-direction-arrow-spherical"));
        }

        for (let stepEdge of this._stepEdges) {
            arrows.push(
                this._createSphericalToPerspectiveArrow(
                    navigator,
                    stepEdge.target,
                    stepEdge.data.worldMotionAzimuth,
                    rotation,
                    stepEdge.data.direction));
        }

        return arrows;
    }

    private _createSphericalToPerspectiveArrow(
        navigator: Navigator,
        key: string,
        azimuth: number,
        rotation: EulerRotation,
        direction: NavigationDirection): vd.VNode {

        let threshold: number = Math.PI / 8;

        let relativePhi: number = rotation.phi;

        switch (direction) {
            case NavigationDirection.StepBackward:
                relativePhi = rotation.phi - Math.PI;
                break;
            case NavigationDirection.StepLeft:
                relativePhi = rotation.phi + Math.PI / 2;
                break;
            case NavigationDirection.StepRight:
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
                this._calculator.outerRadius,
                "mapillary-direction-arrow-step");
        }

        return this._createVNodeInactive(key, azimuth, rotation);
    }

    private _createPerspectiveToSphericalArrows(navigator: Navigator, rotation: EulerRotation): vd.VNode[] {
        let arrows: vd.VNode[] = [];

        for (let sphericalEdge of this._sphericalEdges) {
            arrows.push(
                this._createVNodeByKey(
                    navigator,
                    sphericalEdge.target,
                    sphericalEdge.data.worldMotionAzimuth,
                    rotation,
                    this._calculator.innerRadius,
                    "mapillary-direction-arrow-spherical",
                    true));
        }

        return arrows;
    }

    private _createStepArrows(navigator: Navigator, rotation: EulerRotation): vd.VNode[] {
        let arrows: vd.VNode[] = [];

        for (let stepEdge of this._stepEdges) {
            arrows.push(
                this._createVNodeByDirection(
                    navigator,
                    stepEdge.target,
                    stepEdge.data.worldMotionAzimuth,
                    rotation,
                    stepEdge.data.direction));
        }

        return arrows;
    }

    private _createTurnArrows(navigator: Navigator): vd.VNode[] {
        let turns: vd.VNode[] = [];

        for (let turnEdge of this._turnEdges) {
            let direction: NavigationDirection = turnEdge.data.direction;
            let name: string = this._turnNames[direction];

            turns.push(
                this._createVNodeByTurn(
                    navigator,
                    turnEdge.target,
                    name,
                    direction));
        }

        return turns;
    }

    private _createVNodeByKey(
        navigator: Navigator,
        key: string,
        azimuth: number,
        rotation: EulerRotation,
        offset: number,
        className: string,
        shiftVertically?: boolean): vd.VNode {

        let onClick: (e: Event) => void =
            (e: Event): void => {
                navigator.moveTo$(key)
                    .subscribe(
                        undefined,
                        (error: Error): void => {
                            if (!(error instanceof CancelMapillaryError)) {
                                console.error(error);
                            }
                        });
            };

        return this._createVNode(
            key,
            azimuth,
            rotation,
            offset,
            className,
            "mapillary-direction-circle",
            onClick,
            shiftVertically);
    }

    private _createVNodeByDirection(
        navigator: Navigator,
        key: string,
        azimuth: number,
        rotation: EulerRotation,
        direction: NavigationDirection): vd.VNode {

        let onClick: (e: Event) => void =
            (e: Event): void => {
                navigator.moveDir$(direction)
                    .subscribe(
                        undefined,
                        (error: Error): void => {
                            if (!(error instanceof CancelMapillaryError)) {
                                console.error(error);
                            }
                        });
            };

        return this._createVNode(
            key,
            azimuth,
            rotation,
            this._calculator.outerRadius,
            "mapillary-direction-arrow-step",
            "mapillary-direction-circle",
            onClick);
    }

    private _createVNodeByTurn(
        navigator: Navigator,
        key: string,
        className: string,
        direction: NavigationDirection): vd.VNode {

        let onClick: (e: Event) => void =
            (e: Event): void => {
                navigator.moveDir$(direction)
                    .subscribe(
                        undefined,
                        (error: Error): void => {
                            if (!(error instanceof CancelMapillaryError)) {
                                console.error(error);
                            }
                        });
            };

        let style: any = {
            height: this._calculator.turnCircleSizeCss,
            transform: "rotate(0)", // apply transform to preserve 3D
            width: this._calculator.turnCircleSizeCss,
        };

        switch (direction) {
            case NavigationDirection.TurnLeft:
                style.left = "5px";
                style.top = "5px";
                break;
            case NavigationDirection.TurnRight:
                style.right = "5px";
                style.top = "5px";
                break;
            case NavigationDirection.TurnU:
                style.left = "5px";
                style.bottom = "5px";
                break;
            default:
                break;
        }

        let circleProperties: vd.createProperties = {
            attributes: {
                "data-id": key,
            },
            onclick: onClick,
            style: style,
        };

        let circleClassName: string = "mapillary-direction-turn-circle";

        if (this._sequenceEdgeKeys.indexOf(key) > -1) {
            circleClassName += "-sequence";
        }

        if (this._highlightKey === key) {
            circleClassName += "-highlight";
        }

        let turn: vd.VNode = vd.h(`div.${className}`, {}, []);

        return vd.h("div." + circleClassName, circleProperties, [turn]);
    }

    private _createVNodeInactive(key: string, azimuth: number, rotation: EulerRotation): vd.VNode {
        return this._createVNode(
            key,
            azimuth,
            rotation,
            this._calculator.outerRadius,
            "mapillary-direction-arrow-inactive",
            "mapillary-direction-circle-inactive");
    }

    private _createVNode(
        key: string,
        azimuth: number,
        rotation: EulerRotation,
        radius: number,
        className: string,
        circleClassName: string,
        onClick?: (e: Event) => void,
        shiftVertically?: boolean): vd.VNode {

        let translation: number[] = this._calculator.angleToCoordinates(azimuth - rotation.phi);

        // rotate 90 degrees clockwise and flip over X-axis
        let translationX: number = Math.round(-radius * translation[1] + 0.5 * this._calculator.containerWidth);
        let translationY: number = Math.round(-radius * translation[0] + 0.5 * this._calculator.containerHeight);

        let shadowTranslation: number[] = this._calculator.relativeAngleToCoordiantes(azimuth, rotation.phi);
        let shadowOffset: number = this._calculator.shadowOffset;
        let shadowTranslationX: number = -shadowOffset * shadowTranslation[1];
        let shadowTranslationY: number = shadowOffset * shadowTranslation[0];

        let filter: string = `drop-shadow(${shadowTranslationX}px ${shadowTranslationY}px 1px rgba(0,0,0,0.8))`;

        let properties: vd.createProperties = {
            style: {
                "-webkit-filter": filter,
                filter: filter,
            },
        };

        let chevron: vd.VNode = vd.h("div." + className, properties, []);

        let azimuthDeg: number = -this._spatial.radToDeg(azimuth - rotation.phi);
        let circleTransform: string = shiftVertically ?
            `translate(${translationX}px, ${translationY}px) rotate(${azimuthDeg}deg) translateZ(-0.01px)` :
            `translate(${translationX}px, ${translationY}px) rotate(${azimuthDeg}deg)`;

        let circleProperties: vd.createProperties = {
            attributes: { "data-id": key },
            onclick: onClick,
            style: {
                height: this._calculator.stepCircleSizeCss,
                marginLeft: this._calculator.stepCircleMarginCss,
                marginTop: this._calculator.stepCircleMarginCss,
                transform: circleTransform,
                width: this._calculator.stepCircleSizeCss,
            },
        };

        if (this._sequenceEdgeKeys.indexOf(key) > -1) {
            circleClassName += "-sequence";
        }

        if (this._highlightKey === key) {
            circleClassName += "-highlight";
        }

        return vd.h("div." + circleClassName, circleProperties, [chevron]);
    }

    private _getContainer(
        steps: vd.VNode[],
        turns: vd.VNode[],
        rotation: EulerRotation): vd.VNode {

        // edge does not handle hover on perspective transforms.
        let transform: string = this._isEdge ?
            "rotateX(60deg)" :
            `perspective(${this._calculator.containerWidthCss}) rotateX(60deg)`;

        let properties: vd.createProperties = {
            oncontextmenu: (event: MouseEvent): void => { event.preventDefault(); },
            style: {
                bottom: this._calculator.containerBottomCss,
                height: this._calculator.containerHeightCss,
                left: this._calculator.containerLeftCss,
                marginLeft: this._calculator.containerMarginCss,
                transform: transform,
                width: this._calculator.containerWidthCss,
            },
        };

        return vd.h("div.mapillary-direction-perspective", properties, turns.concat(steps));
    }
}
