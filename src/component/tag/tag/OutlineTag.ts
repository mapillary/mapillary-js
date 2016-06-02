/// <reference path="../../../../typings/index.d.ts" />

import * as THREE from "three";
import * as vd from "virtual-dom";

import {
    VertexGeometry,
    IOutlineTagOptions,
    Tag,
    TagOperation,
} from "../../../Component";
import {Transform} from "../../../Geo";
import {ISpriteAtlas} from "../../../Viewer";

/**
 * @class OutlineTag
 * @classdesc Tag visualizing a geometry outline.
 */
export class OutlineTag extends Tag {
    protected _geometry: VertexGeometry;

    private _editable: boolean;
    private _icon: string;
    private _lineColor: number;
    private _lineWidth: number;
    private _text: string;
    private _textColor: number;

    /**
     * Create an outline tag.
     *
     * @override
     * @constructor
     * @param {string} id
     * @param {Geometry} geometry
     * @param {IOutlineTagOptions} options - Options defining the visual appearance and
     * behavior of the outline tag.
     */
    constructor(id: string, geometry: VertexGeometry, options: IOutlineTagOptions) {
        super(id, geometry);

        this._editable = options.editable ? options.editable : false;
        this._icon = options.icon ? options.icon : null;
        this._lineColor = options.lineColor ? options.lineColor : 0xFFFFFF;
        this._lineWidth = options.lineWidth ? options.lineWidth : 1;
        this._text = options.text ? options.text : null;
        this._textColor = options.textColor ? options.textColor : 0xFFFFFF;
    }

    /**
     * Get editable property.
     * @returns {boolean} Value indicating if tag is editable.
     */
    public get editable(): boolean {
        return this._editable;
    }

    /**
     * Set editable property.
     * @param {boolean}
     *
     * @fires Tag#changed
     */
    public set editable(value: boolean) {
        this._editable = value;
        this._notifyChanged$.onNext(this);
    }

    /**
     * Get icon property.
     * @returns {string}
     */
    public get icon(): string {
        return this._icon;
    }

    /**
     * Set icon property.
     * @param {string}
     *
     * @fires Tag#changed
     */
    public set icon(value: string) {
        this._icon = value;
        this._notifyChanged$.onNext(this);
    }

    /**
     * Get line color property.
     * @returns {number}
     */
    public get lineColor(): number {
        return this._lineColor;
    }

    /**
     * Set line color property.
     * @param {number}
     *
     * @fires Tag#changed
     */
    public set lineColor(value: number) {
        this._lineColor = value;
        this._notifyChanged$.onNext(this);
    }

    /**
     * Get line width property.
     * @returns {number}
     */
    public get lineWidth(): number {
        return this._lineWidth;
    }

    /**
     * Set line width property.
     * @param {number}
     *
     * @fires Tag#changed
     */
    public set lineWidth(value: number) {
        this._lineWidth = value;
        this._notifyChanged$.onNext(this);
    }

    /**
     * Get text property.
     * @returns {string}
     */
    public get text(): string {
        return this._text;
    }

    /**
     * Set text property.
     * @param {string}
     *
     * @fires Tag#changed
     */
    public set text(value: string) {
        this._text = value;
        this._notifyChanged$.onNext(this);
    }

    /**
     * Get text color property.
     * @returns {number}
     */
    public get textColor(): number {
        return this._textColor;
    }

    /**
     * Set text color property.
     * @param {number}
     *
     * @fires Tag#changed
     */
    public set textColor(value: number) {
        this._textColor = value;
        this._notifyChanged$.onNext(this);
    }

    public getGLObjects(transform: Transform): THREE.Object3D[] {
        let points3d: number[][] = this._geometry.getPoints3d(transform);
        let positions: Float32Array = this._getPositions(points3d);

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
        let vertices3d: number[][] = this._geometry.getVertices3d(transform);

        let abort: (e: MouseEvent) => void = (e: MouseEvent): void => {
            this._abort$.onNext(this._id);
        };

        let symbolVertex: THREE.Vector3 = this._convertToCameraSpace(vertices3d[3], matrixWorldInverse);
        if (symbolVertex.z < 0) {
            let interact: (e: MouseEvent) => void = (e: MouseEvent): void => {
                this._interact$.onNext({ offsetX: 0, offsetY: 0, operation: TagOperation.None, tag: this });
            };

            if (this._icon != null) {
                if (atlas.loaded) {
                    let sprite: vd.VNode = atlas.getDOMSprite(this._icon);

                    let labelCanvas: number[] = this._projectToCanvas(symbolVertex, projectionMatrix);
                    let labelCss: string[] = labelCanvas.map((coord: number): string => { return (100 * coord) + "%"; });

                    let properties: vd.createProperties = {
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
                let labelCanvas: number[] = this._projectToCanvas(symbolVertex, projectionMatrix);
                let labelCss: string[] = labelCanvas.map((coord: number): string => { return (100 * coord) + "%"; });

                let properties: vd.createProperties = {
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

        for (let i: number = 0; i < vertices3d.length - 1; i++) {
            let vertexCameraSpace: THREE.Vector3 = this._convertToCameraSpace(vertices3d[i], matrixWorldInverse);

            if (vertexCameraSpace.z > 0) {
                continue;
            }

            let interact: (e: MouseEvent) => void = this._interact(TagOperation.Vertex, i);

            let cornerCanvas: number[] = this._projectToCanvas(vertexCameraSpace, projectionMatrix);
            let cornerCss: string[] = cornerCanvas.map((coord: number): string => { return (100 * coord) + "%"; });

            let properties: vd.createProperties = {
                onmousedown: interact,
                onmouseup: abort,
                style: { background: lineColor, left: cornerCss[0], position: "absolute", top: cornerCss[1] },
            };

            vNodes.push(vd.h("div.TagResizer", properties, []));
        }

        let centroid3d: number[] = this._geometry.getCentroid3d(transform);
        let centroidCameraSpace: THREE.Vector3 = this._convertToCameraSpace(centroid3d, matrixWorldInverse);
        if (centroidCameraSpace.z < 0) {
            let interact: (e: MouseEvent) => void = this._interact(TagOperation.Centroid);

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

    private _interact(operation: TagOperation, vertexIndex?: number): (e: MouseEvent) => void {
        return (e: MouseEvent): void => {
            let offsetX: number = e.offsetX - (<HTMLElement>e.target).offsetWidth / 2;
            let offsetY: number = e.offsetY - (<HTMLElement>e.target).offsetHeight / 2;

            this._interact$.onNext({
                offsetX: offsetX,
                offsetY: offsetY,
                operation: operation,
                tag: this,
                vertexIndex: vertexIndex,
            });
        };
    }

    private _getPositions(points3d: number[][]): Float32Array {
        let length: number = points3d.length;
        let positions: Float32Array = new Float32Array(length * 3);

        for (let i: number = 0; i < length; ++i) {
            let index: number = 3 * i;

            let position: number[] = points3d[i];

            positions[index] = position[0];
            positions[index + 1] = position[1];
            positions[index + 2] = position[2];
        }

        return positions;
    }
}

export default OutlineTag;
