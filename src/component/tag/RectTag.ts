/// <reference path="../../../typings/browser.d.ts" />

import * as THREE from "three";
import * as vd from "virtual-dom";

import {Geometry} from "../../Component";
import {Transform} from "../../Geo";
import {ISpriteAtlas} from "../../Viewer";

export class RectTag {
    private _id: string;
    private _editable: boolean;
    private _geometry: Geometry;

    constructor(id: string, editable: boolean, geometry: Geometry) {
        this._id = id;
        this._editable = editable;
        this._geometry = geometry;
    }

    public get editable(): boolean {
        return this._editable;
    }

    public get geometry(): Geometry {
        return this._geometry;
    }

    public getDOMGeometry(atlas: ISpriteAtlas, camera: THREE.PerspectiveCamera, transform: Transform): vd.VNode[] {
        return null;

        /*
        let vNodes: vd.VNode[] = [];
        let matrixWorldInverse: THREE.Matrix4 = new THREE.Matrix4().getInverse(camera.matrixWorld);


        let abort: (e: MouseEvent) => void = (e: MouseEvent): void => {
            this._interactionAbort$.onNext(this._id);
        };

        let polygonPoints3d: number[][] = this.getPolygonPoints3d(transform);

        let bottomRightCamera: THREE.Vector3 = this._convertToCameraSpace(polygonPoints3d[3], matrixWorldInverse);
        if (bottomRightCamera.z < 0) {
            let labelCanvas: number[] = this._projectToCanvas(bottomRightCamera, camera.projectionMatrix);
            let labelCss: string[] = labelCanvas.map((coord: number): string => { return (100 * coord) + "%"; });
            let labelClick: (e: MouseEvent) => void = (e: MouseEvent): void => {
                this._labelClick$.onNext(this);
            };

            let activateNone: (e: MouseEvent) => void = (e: MouseEvent): void => {
                this._activeTag$.onNext({ offsetX: 0, offsetY: 0, operation: TagOperation.None, tag: this });
                this._interactionInitiate$.onNext(this._id);
            };

            if (this._labelKind === TagLabelKind.Text) {
                let properties: vd.createProperties = {
                    onclick: labelClick,
                    onmousedown: activateNone,
                    onmouseup: abort,
                    style: { left: labelCss[0], position: "absolute", top: labelCss[1] },
                    textContent: this._label,
                };

                vNodes.push(vd.h("span.TagLabel", properties, []));
            } else if (this._labelKind === TagLabelKind.Icon) {
                if (atlas.loaded) {
                    let sprite: vd.VNode = atlas.getDOMSprite(this._label);

                    let properties: vd.createProperties = {
                        onclick: labelClick,
                        onmousedown: activateNone,
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
            }
        }

        if (!this._editable) {
            return vNodes;
        }

        for (let i: number = 0; i < polygonPoints3d.length - 1; i++) {
            let polygonPoint3d: number[] = polygonPoints3d[i];
            let pointCameraSpace: THREE.Vector3 = this._convertToCameraSpace(polygonPoint3d, matrixWorldInverse);

            if (pointCameraSpace.z > 0) {
                continue;
            }

            let cornerCanvas: number[] = this._projectToCanvas(pointCameraSpace, camera.projectionMatrix);
            let cornerCss: string[] = cornerCanvas.map((coord: number): string => { return (100 * coord) + "%"; });

            let activateResize: (e: MouseEvent) => void = this._activateTag(this, TagOperation.Resize, i);

            let properties: vd.createProperties = {
                onmousedown: activateResize,
                onmouseup: abort,
                style: { left: cornerCss[0], top: cornerCss[1] },
            };

            vNodes.push(vd.h("div.TagResizer", properties, []));
        }

        let centerCamera: THREE.Vector3 = this._convertToCameraSpace(this.getCentroidPoint3d(transform), matrixWorldInverse);
        if (centerCamera.z < 0) {
            let centerCanvas: number[] = this._projectToCanvas(centerCamera, camera.projectionMatrix);
            let centerCss: string[] = centerCanvas.map((coord: number): string => { return (100 * coord) + "%"; });

            let activateMove: (e: MouseEvent) => void = this._activateTag(this, TagOperation.Move);

            let properties: vd.createProperties = {
                onmousedown: activateMove,
                onmouseup: abort,
                style: { left: centerCss[0], top: centerCss[1] },
            };

            vNodes.push(vd.h("div.TagMover", properties, []));
        }

        return vNodes;

        */
    }

    /*
    private _activateTag(tag: Tag, operation: TagOperation, resizeIndex?: number): (e: MouseEvent) => void {
        return (e: MouseEvent): void => {
            let offsetX: number = e.offsetX - (<HTMLElement>e.target).offsetWidth / 2;
            let offsetY: number = e.offsetY - (<HTMLElement>e.target).offsetHeight / 2;

            this._activeTag$.onNext({
                offsetX: offsetX,
                offsetY: offsetY,
                operation: operation,
                resizeIndex: resizeIndex,
                tag: tag,
            });

            this._interactionInitiate$.onNext(tag.id);
        };
    }
    */
}

export default RectTag;
