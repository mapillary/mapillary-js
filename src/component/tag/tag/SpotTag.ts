/// <reference path="../../../../typings/browser.d.ts" />

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

export class SpotTag extends Tag {
    protected _geometry: Geometry;

    private _color: number;
    private _editable: boolean;
    private _icon: string;
    private _text: string;
    private _textColor: number;

    constructor(id: string, geometry: Geometry, options: ISpotTagOptions) {
        super(id, geometry);

        this._color = options.color ? options.color : 0xFFFFFF;
        this._editable = options.editable ? options.editable : false;
        this._icon = options.icon ? options.icon : null;
        this._text = options.text ? options.text : null;
        this._textColor = options.textColor ? options.textColor : 0xFFFFFF;
    }

    public get color(): number {
        return this._color;
    }

    public set color(value: number) {
        this._color = value;
        this._notifyChanged$.onNext(this);
    }

    public get editable(): boolean {
        return this._editable;
    }

    public set editable(value: boolean) {
        this._editable = value;
        this._notifyChanged$.onNext(this);
    }

    public get icon(): string {
        return this._icon;
    }

    public set icon(value: string) {
        this._icon = value;
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
        return [];
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
        };

        let centroid3d: number[] = this._geometry.getCentroid3d(transform);
        let centroidCameraSpace: THREE.Vector3 = this._convertToCameraSpace(centroid3d, matrixWorldInverse);
        if (centroidCameraSpace.z < 0) {
            let centroidCanvas: number[] = this._projectToCanvas(centroidCameraSpace, projectionMatrix);
            let centroidCss: string[] = centroidCanvas.map((coord: number): string => { return (100 * coord) + "%"; });

            let interactNone: (e: MouseEvent) => void = (e: MouseEvent): void => {
                this._interact$.onNext({ offsetX: 0, offsetY: 0, operation: TagOperation.None, tag: this });
            };

            if (this._icon != null) {
                if (atlas.loaded) {
                    let sprite: vd.VNode = atlas.getDOMSprite(this._icon, SpriteAlignment.Center, SpriteAlignment.End);

                    let properties: vd.createProperties = {
                        onmousedown: interactNone,
                        onmouseup: abort,
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
                    onmouseup: abort,
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
                    onmouseup: abort,
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

            this._interact$.onNext({
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
