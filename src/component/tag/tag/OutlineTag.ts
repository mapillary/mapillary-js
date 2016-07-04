/// <reference path="../../../../typings/index.d.ts" />

import * as THREE from "three";
import * as vd from "virtual-dom";

import {
    VertexGeometry,
    RectGeometry,
    IOutlineTagOptions,
    Tag,
    TagOperation,
} from "../../../Component";
import {Transform} from "../../../Geo";
import {ISpriteAtlas, SpriteAlignment} from "../../../Viewer";

/**
 * @class OutlineTag
 * @classdesc Tag visualizing a geometry outline.
 */
export class OutlineTag extends Tag {
    protected _geometry: VertexGeometry;

    private _editable: boolean;
    private _icon: string;
    private _iconIndex: number;
    private _lineColor: number;
    private _lineWidth: number;
    private _fillColor: number;
    private _fillOpacity: number;
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

        this._editable = options.editable == null ? false : options.editable;
        this._fillColor = options.fillColor == null ? 0xFFFFFF : options.fillColor;
        this._fillOpacity = options.fillOpacity == null ? 0.0 : options.fillOpacity;
        this._icon = options.icon === undefined ? null : options.icon;
        this._iconIndex = options.iconIndex == null ? 3 : options.iconIndex;
        this._lineColor = options.lineColor == null ? 0xFFFFFF : options.lineColor;
        this._lineWidth = options.lineWidth == null ? 1 : options.lineWidth;
        this._text = options.text === undefined ? null : options.text;
        this._textColor = options.textColor == null ? 0xFFFFFF : options.textColor;
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
     * Get fill color property.
     * @returns {number}
     */
    public get fillColor(): number {
        return this._fillColor;
    }

    /**
     * Set fill color property.
     * @param {number}
     *
     * @fires Tag#changed
     */
    public set fillColor(value: number) {
        this._fillColor = value;
        this._notifyChanged$.onNext(this);
    }

    /**
     * Get fill opacity property.
     * @returns {number}
     */
    public get fillOpacity(): number {
        return this._fillOpacity;
    }

    /**
     * Set fill opacity property.
     * @param {number}
     *
     * @fires Tag#changed
     */
    public set fillOpacity(value: number) {
        this._fillOpacity = value;
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
     * Get icon index property.
     * @returns {number}
     */
    public get iconIndex(): number {
        return this._iconIndex;
    }

    /**
     * Set icon index property.
     * @param {number}
     *
     * @fires Tag#changed
     */
    public set iconIndex(value: number) {
        this._iconIndex = value;
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

    /**
     * Set options for tag.
     *
     * @description Sets all the option properties provided and keps
     * the rest of the values as is.
     *
     * @param {IOutlineTagOptions} options - Outline tag options
     *
     * @fires {Tag#changed}
     */
    public setOptions(options: IOutlineTagOptions): void {
        this._editable = options.editable == null ? this._editable : options.editable;
        this._icon = options.icon === undefined ? this._icon : options.icon;
        this._lineColor = options.lineColor == null ? this._lineColor : options.lineColor;
        this._lineWidth = options.lineWidth == null ? this._lineWidth : options.lineWidth;
        this._fillColor = options.fillColor == null ? this._fillColor : options.fillColor;
        this._fillOpacity = options.fillOpacity == null ? this._fillOpacity : options.fillOpacity;
        this._text = options.text === undefined ? this._text : options.text;
        this._textColor = options.textColor == null ? this._textColor : options.textColor;
        this._notifyChanged$.onNext(this);
    }

    public getGLObjects(transform: Transform): THREE.Object3D[] {
        let objects: THREE.Object3D[] = [];

        if (this._lineWidth > 0) {
            objects.push(this._getGLLine(transform));
        }

        if (this._fillOpacity > 0 && !transform.gpano) {
            objects.push(this._getGLMesh(transform));
        }

        return objects;
    }

    public getDOMObjects(
        transform: Transform,
        atlas: ISpriteAtlas,
        matrixWorldInverse: THREE.Matrix4,
        projectionMatrix: THREE.Matrix4):
        vd.VNode[] {

        let vNodes: vd.VNode[] = [];

        let abort: (e: MouseEvent) => void = (e: MouseEvent): void => {
            this._abort$.onNext(this._id);
            this._interact$.onNext({ offsetX: 0, offsetY: 0, operation: TagOperation.None, tag: this });
        };

        if (this._geometry instanceof RectGeometry) {
            if (this._icon != null) {
                let iconVertex: number[] = this._geometry.getVertex3d(this._iconIndex, transform);
                let iconCameraSpace: THREE.Vector3 = this._convertToCameraSpace(iconVertex, matrixWorldInverse);
                if (iconCameraSpace.z < 0) {
                    let interact: (e: MouseEvent) => void = (e: MouseEvent): void => {
                        this._interact$.onNext({ offsetX: 0, offsetY: 0, operation: TagOperation.None, tag: this });
                    };

                    if (atlas.loaded) {
                        let sprite: vd.VNode = atlas.getDOMSprite(this._icon, SpriteAlignment.Start, SpriteAlignment.Start);

                        let iconCanvas: number[] = this._projectToCanvas(iconCameraSpace, projectionMatrix);
                        let iconCss: string[] = iconCanvas.map((coord: number): string => { return (100 * coord) + "%"; });

                        let properties: vd.createProperties = {
                            onmousedown: interact,
                            onmouseup: abort,
                            style: {
                                left: iconCss[0],
                                pointerEvents: "all",
                                position: "absolute",
                                top: iconCss[1],
                            },
                        };

                        vNodes.push(vd.h("div.TagSymbol", properties, [sprite]));
                    }
                }
            } else if (this._text != null) {
                let textVertex: number[] = this._geometry.getVertex3d(3, transform);
                let textCameraSpace: THREE.Vector3 = this._convertToCameraSpace(textVertex, matrixWorldInverse);
                if (textCameraSpace.z < 0) {
                    let interact: (e: MouseEvent) => void = (e: MouseEvent): void => {
                        this._interact$.onNext({ offsetX: 0, offsetY: 0, operation: TagOperation.None, tag: this });
                    };

                    let labelCanvas: number[] = this._projectToCanvas(textCameraSpace, projectionMatrix);
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
        }

        if (!this._editable) {
            return vNodes;
        }

        let lineColor: string = "#" + ("000000" + this._lineColor.toString(16)).substr(-6);

        if (this._geometry instanceof RectGeometry) {
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
        }

        let vertices3d: number[][] = this._geometry.getVertices3d(transform);

        for (let i: number = 0; i < vertices3d.length - 1; i++) {
            if (this._geometry instanceof RectGeometry &&
                ((this._icon != null && i === this._iconIndex) ||
                (this._icon == null && this._text != null && i === 3))) {
                continue;
            }

            let vertexCameraSpace: THREE.Vector3 = this._convertToCameraSpace(vertices3d[i], matrixWorldInverse);

            if (vertexCameraSpace.z > 0) {
                continue;
            }

            let interact: (e: MouseEvent) => void = this._interact(TagOperation.Vertex, i);

            let vertexCanvas: number[] = this._projectToCanvas(vertexCameraSpace, projectionMatrix);
            let vertexCss: string[] = vertexCanvas.map((coord: number): string => { return (100 * coord) + "%"; });

            let properties: vd.createProperties = {
                onmousedown: interact,
                onmouseup: abort,
                style: { background: lineColor, left: vertexCss[0], position: "absolute", top: vertexCss[1] },
            };

            let pointProperties: vd.createProperties = {
                style: { background: lineColor, left: vertexCss[0], position: "absolute", top: vertexCss[1] },
            };

            vNodes.push(vd.h("div.TagResizer", properties, []));
            vNodes.push(vd.h("div.TagVertex", pointProperties, []));
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

    private _getLinePositions(points3d: number[][]): Float32Array {
        let length: number = points3d.length;
        let positions: Float32Array = new Float32Array(length * 3);

        for (let i: number = 0; i < length; ++i) {
            let index: number = 3 * i;
            let position: number[] = points3d[i];

            positions[index + 0] = position[0];
            positions[index + 1] = position[1];
            positions[index + 2] = position[2];
        }

        return positions;
    }

    private _getGLLine(transform: Transform): THREE.Object3D {
        let points3d: number[][] = this._geometry.getPoints3d(transform);
        let positions: Float32Array = this._getLinePositions(points3d);

        let geometry: THREE.BufferGeometry = new THREE.BufferGeometry();
        geometry.addAttribute("position", new THREE.BufferAttribute(positions, 3));

        let material: THREE.LineBasicMaterial =
            new THREE.LineBasicMaterial(
                {
                    color: this._lineColor,
                    linewidth: this._lineWidth,
                });

        return new THREE.Line(geometry, material);
    }

    private _getGLMesh(transform: Transform): THREE.Object3D {
        let triangles: number[] = this._geometry.getTriangles3d(transform);
        let positions: Float32Array = new Float32Array(triangles);

        let geometry: THREE.BufferGeometry = new THREE.BufferGeometry();
        geometry.addAttribute("position", new THREE.BufferAttribute(positions, 3));

        let material: THREE.MeshBasicMaterial =
            new THREE.MeshBasicMaterial(
                {
                    color: this._fillColor,
                    opacity: this._fillOpacity,
                    side: THREE.BackSide,
                    transparent: true,
                });

        return new THREE.Mesh(geometry, material);
    }
}

export default OutlineTag;
