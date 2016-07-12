/// <reference path="../../../../typings/index.d.ts" />

import * as THREE from "three";
import * as vd from "virtual-dom";

import {
    Geometry,
    ISpotTagOptions,
    Tag,
    TagOperation,
} from "../../../Component";
import {Transform} from "../../../Geo";
import {ISpriteAtlas, SpriteAlignment} from "../../../Viewer";

/**
 * @class SpotTag
 * @classdesc Tag visualizing the centroid of a geometry.
 */
export class SpotTag extends Tag {
    protected _geometry: Geometry;

    private _color: number;
    private _editable: boolean;
    private _icon: string;
    private _text: string;
    private _textColor: number;

    /**
     * Create a spot tag.
     *
     * @override
     * @constructor
     * @param {string} id
     * @param {Geometry} geometry
     * @param {IOutlineTagOptions} options - Options defining the visual appearance and
     * behavior of the spot tag.
     */
    constructor(id: string, geometry: Geometry, options: ISpotTagOptions) {
        super(id, geometry);

        this._color = options.color == null ? 0xFFFFFF : options.color;
        this._editable = options.editable == null ? false : options.editable;
        this._icon = options.icon === undefined ? null : options.icon;
        this._text = options.text === undefined ? null : options.text;
        this._textColor = options.textColor == null ? 0xFFFFFF : options.textColor;
    }

    /**
     * Get color property.
     * @returns {number} The color of the spot as a hexagonal number;
     */
    public get color(): number {
        return this._color;
    }

    /**
     * Set color property.
     * @param {number}
     *
     * @fires Tag#changed
     */
    public set color(value: number) {
        this._color = value;
        this._notifyChanged$.next(this);
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
        this._notifyChanged$.next(this);
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
        this._notifyChanged$.next(this);
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
        this._notifyChanged$.next(this);
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
        this._notifyChanged$.next(this);
    }

    /**
     * Set options for tag.
     *
     * @description Sets all the option properties provided and keps
     * the rest of the values as is.
     *
     * @param {ISpotTagOptions} options - Spot tag options
     *
     * @fires {Tag#changed}
     */
    public setOptions(options: ISpotTagOptions): void {
        this._color = options.color == null ? this._color : options.color;
        this._editable = options.editable == null ? this._editable : options.editable;
        this._icon = options.icon === undefined ? this._icon : options.icon;
        this._text = options.text === undefined ? this._text : options.text;
        this._textColor = options.textColor == null ? this._textColor : options.textColor;
        this._notifyChanged$.next(this);
    }

    public getGLObjects(transform: Transform): THREE.Object3D[] {
        return [];
    }

    public getDOMObjects(
        transform: Transform,
        atlas: ISpriteAtlas,
        matrixWorldInverse: THREE.Matrix4,
        projectionMatrix: THREE.Matrix4):
        vd.VNode[] {

        let vNodes: vd.VNode[] = [];

        let centroid3d: number[] = this._geometry.getCentroid3d(transform);
        let centroidCameraSpace: THREE.Vector3 = this._convertToCameraSpace(centroid3d, matrixWorldInverse);
        if (centroidCameraSpace.z < 0) {
            let centroidCanvas: number[] = this._projectToCanvas(centroidCameraSpace, projectionMatrix);
            let centroidCss: string[] = centroidCanvas.map((coord: number): string => { return (100 * coord) + "%"; });

            let interactNone: (e: MouseEvent) => void = (e: MouseEvent): void => {
                this._interact$.next({ offsetX: 0, offsetY: 0, operation: TagOperation.None, tag: this });
            };

            if (this._icon != null) {
                if (atlas.loaded) {
                    let sprite: vd.VNode = atlas.getDOMSprite(this._icon, SpriteAlignment.Center, SpriteAlignment.End);

                    let properties: vd.createProperties = {
                        onmousedown: interactNone,
                        style: {
                            bottom: 100 * (1 - centroidCanvas[1]) + "%",
                            left: centroidCss[0],
                            pointerEvents: "all",
                            position: "absolute",
                            transform: "translate(0px, -8px)",
                        },
                    };

                    vNodes.push(vd.h("div", properties, [sprite]));
                }
            } else if (this._text != null) {
                let properties: vd.createProperties = {
                    onmousedown: interactNone,
                    style: {
                        bottom: 100 * (1 - centroidCanvas[1]) + "%",
                        color: "#" + ("000000" + this._textColor.toString(16)).substr(-6),
                        left: centroidCss[0],
                        pointerEvents: "all",
                        position: "absolute",
                        transform: "translate(-50%, -7px)",
                    },
                    textContent: this._text,
                };

                vNodes.push(vd.h("span.TagSymbol", properties, []));
            }

            let interact: (e: MouseEvent) => void = this._interact(TagOperation.Centroid);

            let background: string = "#" + ("000000" + this.color.toString(16)).substr(-6);

            if (this._editable) {
                let interactorProperties: vd.createProperties = {
                    onmousedown: interact,
                    style: {
                        background: background,
                        left: centroidCss[0],
                        pointerEvents: "all",
                        position: "absolute",
                        top: centroidCss[1],
                    },
                };

                vNodes.push(vd.h("div.TagSpotInteractor", interactorProperties, []));
            }

            let pointProperties: vd.createProperties = {
                style: {
                    background: background,
                    left: centroidCss[0],
                    position: "absolute",
                    top: centroidCss[1],
                },
            };

            vNodes.push(vd.h("div.TagVertex", pointProperties, []));
        }

        return vNodes;
    }

    private _interact(operation: TagOperation, vertexIndex?: number): (e: MouseEvent) => void {
        return (e: MouseEvent): void => {
            let offsetX: number = e.offsetX - (<HTMLElement>e.target).offsetWidth / 2;
            let offsetY: number = e.offsetY - (<HTMLElement>e.target).offsetHeight / 2;

            this._interact$.next({
                offsetX: offsetX,
                offsetY: offsetY,
                operation: operation,
                tag: this,
                vertexIndex: vertexIndex,
            });
        };
    }
}

export default SpotTag;
