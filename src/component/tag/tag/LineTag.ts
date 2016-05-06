/// <reference path="../../../../typings/browser.d.ts" />

import * as THREE from "three";
import * as vd from "virtual-dom";

import {
    Geometry,
    ILineTagOptions,
    Tag,
    TagOperation,
} from "../../../Component";
import {Transform} from "../../../Geo";
import {ISpriteAtlas} from "../../../Viewer";

export class LineTag extends Tag {
    private _icon: string;
    private _lineColor: number;
    private _lineWidth: number;
    private _text: string;
    private _textColor: number;

    constructor(id: string, editable: boolean, geometry: Geometry, parameters: ILineTagOptions) {
        super(id, editable, geometry);

        this._icon = parameters.icon ? parameters.icon : null;
        this._lineColor = parameters.lineColor ? parameters.lineColor : 0xFFFFFF;
        this._lineWidth = parameters.lineWidth ? parameters.lineWidth : 1;
        this._text = parameters.text ? parameters.text : null;
        this._textColor = parameters.textColor ? parameters.textColor : 0xFFFFFF;
    }

    public get icon(): string {
        return this._icon;
    }

    public set icon(value: string) {
        this._icon = value;
        this._notifyChanged$.onNext(this);
    }

    public get lineColor(): number {
        return this._lineColor;
    }

    public set lineColor(value: number) {
        this._lineColor = value;
        this._notifyChanged$.onNext(this);
    }

    public get lineWidth(): number {
        return this._lineWidth;
    }

    public set lineWidth(value: number) {
        this._lineWidth = value;
        this._notifyChanged$.onNext(this);
    }

    public get text(): string {
        return this._text;
    }

    public set text(value: string) {
        this._text = value;
        this._notifyChanged$.onNext(this);
    }

    public get textColor(): number {
        return this._textColor;
    }

    public set textColor(value: number) {
        this._textColor = value;
        this._notifyChanged$.onNext(this);
    }

    public getGLObjects(transform: Transform): THREE.Object3D[] {
        let polygon3d: number[][] = this._geometry.getPolygon3d(transform);
        let positions: Float32Array = this._getPositions(polygon3d);

        let geometry: THREE.BufferGeometry = new THREE.BufferGeometry();
        geometry.addAttribute("position", new THREE.BufferAttribute(positions, 3));

        let material: THREE.LineBasicMaterial =
            new THREE.LineBasicMaterial(
                {
                    color: this._lineColor,
                    linewidth: this._lineWidth,
                });

        return [new THREE.Line(geometry, material)];
    }

    public getDOMObjects(
        transform: Transform,
        atlas: ISpriteAtlas,
        matrixWorldInverse: THREE.Matrix4,
        projectionMatrix: THREE.Matrix4):
        vd.VNode[] {

        let vNodes: vd.VNode[] = [];
        let polygonPoints3d: number[][] = this._geometry.getPolygonPoints3d(transform);

        let abort: (e: MouseEvent) => void = (e: MouseEvent): void => {
            this._abort$.onNext(this._id);
        };

        let symbolPoint: THREE.Vector3 = this._convertToCameraSpace(polygonPoints3d[3], matrixWorldInverse);
        if (symbolPoint.z < 0) {
            let click: (e: MouseEvent) => void = (e: MouseEvent): void => {
                this._click$.onNext(this);
            };

            let interact: (e: MouseEvent) => void = (e: MouseEvent): void => {
                this._interact$.onNext({ offsetX: 0, offsetY: 0, operation: TagOperation.None, tag: this });
            };

            if (this._icon != null) {
                if (atlas.loaded) {
                    let sprite: vd.VNode = atlas.getDOMSprite(this._icon);

                    let labelCanvas: number[] = this._projectToCanvas(symbolPoint, projectionMatrix);
                    let labelCss: string[] = labelCanvas.map((coord: number): string => { return (100 * coord) + "%"; });

                    let properties: vd.createProperties = {
                        onclick: click,
                        onmousedown: interact,
                        onmouseup: abort,
                        style: {
                            left: labelCss[0],
                            pointerEvents: "all",
                            position: "absolute",
                            top: labelCss[1],
                        },
                    };

                    vNodes.push(vd.h("div", properties, [sprite]));
                }
            } else if (this._text != null) {
                let labelCanvas: number[] = this._projectToCanvas(symbolPoint, projectionMatrix);
                let labelCss: string[] = labelCanvas.map((coord: number): string => { return (100 * coord) + "%"; });

                let properties: vd.createProperties = {
                    onclick: click,
                    onmousedown: interact,
                    onmouseup: abort,
                    style: {
                        color: "#" + ("000000" + this._textColor.toString(16)).substr(-6),
                        left: labelCss[0],
                        pointerEvents: "all",
                        position: "absolute",
                        top: labelCss[1],
                    },
                    textContent: this._text,
                };

                vNodes.push(vd.h("span.TagSymbol", properties, []));
            }
        }

        if (!this._editable) {
            return vNodes;
        }

        let lineColor: string = "#" + ("000000" + this._lineColor.toString(16)).substr(-6);

        for (let i: number = 0; i < polygonPoints3d.length - 1; i++) {
            let pointCameraSpace: THREE.Vector3 = this._convertToCameraSpace(polygonPoints3d[i], matrixWorldInverse);

            if (pointCameraSpace.z > 0) {
                continue;
            }

            let interact: (e: MouseEvent) => void = this._interact(TagOperation.Resize, i);

            let cornerCanvas: number[] = this._projectToCanvas(pointCameraSpace, projectionMatrix);
            let cornerCss: string[] = cornerCanvas.map((coord: number): string => { return (100 * coord) + "%"; });

            let properties: vd.createProperties = {
                onmousedown: interact,
                onmouseup: abort,
                style: { background: lineColor, left: cornerCss[0], position: "absolute", top: cornerCss[1] },
            };

            vNodes.push(vd.h("div.TagResizer", properties, []));
        }

        let centroidPoint3d: number[] = this._geometry.getCentroidPoint3d(transform);
        let centroidCameraSpace: THREE.Vector3 = this._convertToCameraSpace(centroidPoint3d, matrixWorldInverse);
        if (centroidCameraSpace.z < 0) {
            let interact: (e: MouseEvent) => void = this._interact(TagOperation.Move);

            let centerCanvas: number[] = this._projectToCanvas(centroidCameraSpace, projectionMatrix);
            let centerCss: string[] = centerCanvas.map((coord: number): string => { return (100 * coord) + "%"; });

            let properties: vd.createProperties = {
                onmousedown: interact,
                onmouseup: abort,
                style: { background: lineColor, left: centerCss[0], position: "absolute", top: centerCss[1] },
            };

            vNodes.push(vd.h("div.TagMover", properties, []));
        }

        return vNodes;
    }

    private _interact(operation: TagOperation, pointIndex?: number): (e: MouseEvent) => void {
        return (e: MouseEvent): void => {
            let offsetX: number = e.offsetX - (<HTMLElement>e.target).offsetWidth / 2;
            let offsetY: number = e.offsetY - (<HTMLElement>e.target).offsetHeight / 2;

            this._interact$.onNext({
                offsetX: offsetX,
                offsetY: offsetY,
                operation: operation,
                pointIndex: pointIndex,
                tag: this,
            });
        };
    }

    private _getPositions(polygon3d: number[][]): Float32Array {
        let length: number = polygon3d.length;
        let positions: Float32Array = new Float32Array(length * 3);

        for (let i: number = 0; i < length; ++i) {
            let index: number = 3 * i;

            let position: number[] = polygon3d[i];

            positions[index] = position[0];
            positions[index + 1] = position[1];
            positions[index + 2] = position[2];
        }

        return positions;
    }
}

export default LineTag;
