import * as vd from "virtual-dom";

import {
    DirectionDOMCalculator,
    IDirectionConfiguration,
} from "../../Component";
import {
    EdgeDirection,
    IEdge,
} from "../../Edge";
import {AbortMapillaryError} from "../../Error";
import {Spatial} from "../../Geo";
import {
    IEdgeStatus,
    Node,
    Sequence,
} from "../../Graph";
import {
    ISize,
    RenderCamera,
} from "../../Render";
import {IRotation} from "../../State";
import {Navigator} from "../../Viewer";

/**
 * @class DirectionDOMRenderer
 * @classdesc DOM renderer for direction arrows.
 */
export class DirectionDOMRenderer {
    private _spatial: Spatial;
    private _calculator: DirectionDOMCalculator;

    private _node: Node;

    private _rotation: IRotation;
    private _epsilon: number;

    private _highlightKey: string;
    private _distinguishSequence: boolean;

    private _needsRender: boolean;

    private _stepEdges: IEdge[];
    private _turnEdges: IEdge[];
    private _panoEdges: IEdge[];
    private _sequenceEdgeKeys: string[];

    private _stepDirections: EdgeDirection[];
    private _turnDirections: EdgeDirection[];
    private _turnNames: {[dir: number]: string};

    private _isEdge: boolean = false;

    constructor(configuration: IDirectionConfiguration, size: ISize) {
        this._spatial = new Spatial();
        this._calculator = new DirectionDOMCalculator(configuration, size);

        this._node = null;

        this._rotation = { phi: 0, theta: 0 };
        this._epsilon = 0.5 * Math.PI / 180;

        this._highlightKey = null;
        this._distinguishSequence = false;

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

        return this._getContainer(steps, turns, rotation);
    }

    public setEdges(edgeStatus: IEdgeStatus, sequence: Sequence): void {
        this._setEdges(edgeStatus, sequence);

        this._setNeedsRender();
    }

    /**
     * Set node for which to show edges.
     *
     * @param {Node} node
     */
    public setNode(node: Node): void {
        this._node = node;
        this._clearEdges();

        this._setNeedsRender();
    }

    /**
     * Set the render camera to use for calculating rotations.
     *
     * @param {RenderCamera} renderCamera
     */
    public setRenderCamera(renderCamera: RenderCamera): void {
        let rotation: IRotation = renderCamera.rotation;

        if (Math.abs(rotation.phi - this._rotation.phi) < this._epsilon) {
            return;
        }

        this._rotation = rotation;

        this._setNeedsRender();
    }

    /**
     * Set configuration values.
     *
     * @param {IDirectionConfiguration} configuration
     */
    public setConfiguration(configuration: IDirectionConfiguration): void {
        let needsRender: boolean = false;
        if (this._highlightKey !== configuration.highlightKey ||
            this._distinguishSequence !== configuration.distinguishSequence) {
            this._highlightKey = configuration.highlightKey;
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
     * @param {ISize} size Size of vßiewer container element.
     */
    public resize(size: ISize): void {
        this._calculator.resize(size);

        this._setNeedsRender();
    }

    private _setNeedsRender(): void {
        if (this._node != null) {
            this._needsRender = true;
        }
    }

    private _clearEdges(): void {
        this._stepEdges = [];
        this._turnEdges = [];
        this._panoEdges = [];
        this._sequenceEdgeKeys = [];
    }

    private _setEdges(edgeStatus: IEdgeStatus, sequence: Sequence): void {
        this._stepEdges = [];
        this._turnEdges = [];
        this._panoEdges = [];
        this._sequenceEdgeKeys = [];

        for (let edge of edgeStatus.edges) {
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

        if (this._distinguishSequence && sequence != null) {
            let edges: IEdge[] = this._panoEdges
                .concat(this._stepEdges)
                .concat(this._turnEdges);

            for (let edge of edges) {
                let edgeKey: string = edge.to;

                for (let sequenceKey of sequence.keys) {
                    if (sequenceKey === edgeKey) {
                        this._sequenceEdgeKeys.push(edgeKey);
                        break;
                    }
                }
            }
        }
    }

    private _createPanoArrows(navigator: Navigator, rotation: IRotation): vd.VNode[] {
        let arrows: vd.VNode[] = [];

        for (let panoEdge of this._panoEdges) {
            arrows.push(
                this._createVNodeByKey(
                    navigator,
                    panoEdge.to,
                    panoEdge.data.worldMotionAzimuth,
                    rotation,
                    this._calculator.outerRadius,
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
                this._calculator.outerRadius,
                "DirectionsArrowStep");
        }

        return this._createVNodeDisabled(key, azimuth, rotation);
    }

    private _createPerspectiveToPanoArrows(navigator: Navigator, rotation: IRotation): vd.VNode[] {
        let arrows: vd.VNode[] = [];

        for (let panoEdge of this._panoEdges) {
            arrows.push(
                this._createVNodeByKey(
                    navigator,
                    panoEdge.to,
                    panoEdge.data.worldMotionAzimuth,
                    rotation,
                    this._calculator.innerRadius,
                    "DirectionsArrowPano",
                    true));
        }

        return arrows;
    }

    private _createStepArrows(navigator: Navigator, rotation: IRotation): vd.VNode[] {
        let arrows: vd.VNode[] = [];

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

    private _createTurnArrows(navigator: Navigator): vd.VNode[] {
        let turns: vd.VNode[] = [];

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
        className: string,
        shiftVertically?: boolean): vd.VNode {

        let onClick: (e: Event) => void =
            (e: Event): void => {
                navigator.moveToKey$(key)
                    .subscribe(
                        undefined,
                        (error: Error): void => {
                            if (!(error instanceof AbortMapillaryError)) {
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
            "DirectionsCircle",
            onClick,
            shiftVertically);
    }

    private _createVNodeByDirection(
        navigator: Navigator,
        key: string,
        azimuth: number,
        rotation: IRotation,
        direction: EdgeDirection): vd.VNode {

        let onClick: (e: Event) => void =
            (e: Event): void => {
                navigator.moveDir$(direction)
                    .subscribe(
                        undefined,
                        (error: Error): void => {
                            if (!(error instanceof AbortMapillaryError)) {
                                console.error(error);
                            }
                        });
            };

        return this._createVNode(
            key,
            azimuth,
            rotation,
            this._calculator.outerRadius,
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
            (e: Event): void => {
                navigator.moveDir$(direction)
                    .subscribe(
                        undefined,
                        (error: Error): void => {
                            if (!(error instanceof AbortMapillaryError)) {
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
            case EdgeDirection.TurnLeft:
                style.left = "5px";
                style.top = "5px";
                break;
            case EdgeDirection.TurnRight:
                style.right = "5px";
                style.top = "5px";
                break;
            case EdgeDirection.TurnU:
                style.left = "5px";
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

        let circleClassName: string = "TurnCircle";

        if (this._sequenceEdgeKeys.indexOf(key) > -1) {
            circleClassName += "Sequence";
        }

        if (this._highlightKey === key) {
            circleClassName += "Highlight";
        }

        let turn: vd.VNode = vd.h(`div.${className}`, {}, []);

        return vd.h("div." + circleClassName, circleProperties, [turn]);
    }

    private _createVNodeDisabled(key: string, azimuth: number, rotation: IRotation): vd.VNode {
        return this._createVNode(
            key,
            azimuth,
            rotation,
            this._calculator.outerRadius,
            "DirectionsArrowDisabled",
            "DirectionsCircleDisabled");
    }

    private _createVNode(
        key: string,
        azimuth: number,
        rotation: IRotation,
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
            attributes: { "data-key": key },
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
            circleClassName += "Sequence";
        }

        if (this._highlightKey === key) {
            circleClassName += "Highlight";
        }

        return vd.h("div." + circleClassName, circleProperties, [chevron]);
    }

    private _getContainer(
        steps: vd.VNode[],
        turns: vd.VNode[],
        rotation: IRotation): vd.VNode {

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

        return vd.h("div.DirectionsPerspective", properties, turns.concat(steps));
    }
}

export default DirectionDOMRenderer;
