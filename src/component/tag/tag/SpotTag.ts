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
import {ISpriteAtlas} from "../../../Viewer";

export class SpotTag extends Tag {
    protected _geometry: Geometry;

    private _color: number;
    private _editable: boolean;

    constructor(id: string, geometry: Geometry, options: ISpotTagOptions) {
        super(id, geometry);

        this._color = options.color ? options.color : 0xFFFFFF;
        this._editable = options.editable ? options.editable : false;
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
            let interact: (e: MouseEvent) => void = this._interact(TagOperation.Centroid);

            let centerCanvas: number[] = this._projectToCanvas(centroidCameraSpace, projectionMatrix);
            let centerCss: string[] = centerCanvas.map((coord: number): string => { return (100 * coord) + "%"; });

            let background: string = "#" + ("000000" + this.color.toString(16)).substr(-6);

            if (this._editable) {
                let interactorProperties: vd.createProperties = {
                    onmousedown: interact,
                    onmouseup: abort,
                    style: {
                        background: background,
                        left: centerCss[0],
                        pointerEvents: "all",
                        position: "absolute",
                        top: centerCss[1],
                    },
                };

                vNodes.push(vd.h("div.TagSpotInteractor", interactorProperties, []));
            }

            let pointProperties: vd.createProperties = {
                style: {
                    background: background,
                    left: centerCss[0],
                    position: "absolute",
                    top: centerCss[1],
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
